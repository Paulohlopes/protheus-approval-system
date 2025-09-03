/**
 * Secure Query Builder for Protheus API
 * Prevents SQL injection by sanitizing and validating inputs
 */

export interface WhereCondition {
  field: string;
  operator: 'eq' | 'like' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
  value: string | number | (string | number)[];
}

export interface QueryOptions {
  tables: string;
  fields: string[];
  where?: WhereCondition[];
  orderBy?: string;
  page?: number;
  pageSize?: number;
}

class ProtheusQueryBuilder {
  private static readonly VALID_OPERATORS = new Set([
    'eq', 'like', 'gt', 'lt', 'gte', 'lte', 'in', 'between'
  ]);

  private static readonly VALID_FIELD_PATTERN = /^[A-Z][A-Z0-9_]*$/;
  private static readonly VALID_TABLE_PATTERN = /^[A-Z][A-Z0-9]*$/;

  /**
   * Build a secure query string for Protheus genericQuery endpoint
   */
  static buildQuery(options: QueryOptions): string {
    const params = new URLSearchParams();

    // Validate and set tables
    const sanitizedTables = this.sanitizeTableName(options.tables);
    params.set('tables', sanitizedTables);

    // Validate and set fields
    const sanitizedFields = this.sanitizeFields(options.fields);
    params.set('fields', sanitizedFields.join(','));

    // Build WHERE clause if provided
    if (options.where && options.where.length > 0) {
      const whereClause = this.buildWhereClause(options.where);
      if (whereClause) {
        params.set('where', whereClause);
      }
    }

    // Add pagination
    if (options.page && options.page > 1) {
      params.set('page', options.page.toString());
    }

    if (options.pageSize) {
      params.set('pageSize', Math.min(options.pageSize, 1000).toString()); // Limit max page size
    }

    // Add ordering
    if (options.orderBy) {
      const sanitizedOrderBy = this.sanitizeField(options.orderBy);
      if (sanitizedOrderBy) {
        params.set('orderBy', sanitizedOrderBy);
      }
    }

    return params.toString();
  }

  /**
   * Build secure WHERE clause
   */
  private static buildWhereClause(conditions: WhereCondition[]): string {
    const clauses: string[] = [];

    for (const condition of conditions) {
      const clause = this.buildConditionClause(condition);
      if (clause) {
        clauses.push(clause);
      }
    }

    // Always add the delete flag condition
    clauses.unshift("SC1.D_E_L_E_T_=' '");

    return clauses.join(' AND ');
  }

  /**
   * Build individual condition clause
   */
  private static buildConditionClause(condition: WhereCondition): string | null {
    // Validate operator
    if (!this.VALID_OPERATORS.has(condition.operator)) {
      console.warn(`Invalid operator: ${condition.operator}`);
      return null;
    }

    // Sanitize field name
    const sanitizedField = this.sanitizeField(condition.field);
    if (!sanitizedField) {
      console.warn(`Invalid field name: ${condition.field}`);
      return null;
    }

    // Build clause based on operator
    switch (condition.operator) {
      case 'eq':
        return `${sanitizedField}='${this.escapeValue(condition.value)}'`;
      
      case 'like':
        return `${sanitizedField} LIKE '%${this.escapeValue(condition.value)}%'`;
      
      case 'gt':
        return `${sanitizedField}>'${this.escapeValue(condition.value)}'`;
      
      case 'lt':
        return `${sanitizedField}<'${this.escapeValue(condition.value)}'`;
      
      case 'gte':
        return `${sanitizedField}>='${this.escapeValue(condition.value)}'`;
      
      case 'lte':
        return `${sanitizedField}<='${this.escapeValue(condition.value)}'`;
      
      case 'in':
        if (!Array.isArray(condition.value)) {
          return null;
        }
        const values = condition.value
          .map(v => `'${this.escapeValue(v)}'`)
          .join(',');
        return `${sanitizedField} IN (${values})`;
      
      case 'between':
        if (!Array.isArray(condition.value) || condition.value.length !== 2) {
          return null;
        }
        return `${sanitizedField} BETWEEN '${this.escapeValue(condition.value[0])}' AND '${this.escapeValue(condition.value[1])}'`;
      
      default:
        return null;
    }
  }

  /**
   * Sanitize table name
   */
  private static sanitizeTableName(tableName: string): string {
    if (!tableName || !this.VALID_TABLE_PATTERN.test(tableName)) {
      throw new Error(`Invalid table name: ${tableName}`);
    }
    return tableName;
  }

  /**
   * Sanitize field names
   */
  private static sanitizeFields(fields: string[]): string[] {
    return fields
      .map(field => this.sanitizeField(field))
      .filter((field): field is string => field !== null);
  }

  /**
   * Sanitize individual field name
   */
  private static sanitizeField(field: string): string | null {
    if (!field || !this.VALID_FIELD_PATTERN.test(field)) {
      return null;
    }
    return field;
  }

  /**
   * Escape SQL values to prevent injection
   */
  private static escapeValue(value: string | number): string {
    if (typeof value === 'number') {
      return value.toString();
    }

    // Convert to string and escape single quotes
    return String(value)
      .replace(/'/g, "''") // SQL standard: double single quotes
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/\0/g, '\\0') // Escape null bytes
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\x1a/g, '\\Z'); // Escape ctrl+Z
  }
}

export default ProtheusQueryBuilder;