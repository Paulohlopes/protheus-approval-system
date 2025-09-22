/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  type: 'render' | 'interaction' | 'api' | 'computation';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private isEnabled = process.env.NODE_ENV === 'development';

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  startTimer(name: string) {
    if (!this.isEnabled) return;
    this.timers.set(name, performance.now());
  }

  endTimer(name: string, type: PerformanceMetric['type'] = 'computation') {
    if (!this.isEnabled) return;

    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      type
    };

    this.metrics.push(metric);

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow ${type}: ${name} took ${duration.toFixed(2)}ms`);
    } else if (duration > 16.67) { // > 1 frame at 60fps
      console.info(`Performance note: ${name} took ${duration.toFixed(2)}ms`);
    }

    return metric;
  }

  measure<T>(name: string, fn: () => T, type: PerformanceMetric['type'] = 'computation'): T {
    if (!this.isEnabled) return fn();

    this.startTimer(name);
    try {
      const result = fn();
      this.endTimer(name, type);
      return result;
    } catch (error) {
      this.endTimer(name, type);
      throw error;
    }
  }

  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    type: PerformanceMetric['type'] = 'api'
  ): Promise<T> {
    if (!this.isEnabled) return fn();

    this.startTimer(name);
    try {
      const result = await fn();
      this.endTimer(name, type);
      return result;
    } catch (error) {
      this.endTimer(name, type);
      throw error;
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  getSlowMetrics(threshold = 100): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.duration > threshold);
  }

  getAverageTime(name: string): number {
    const matchingMetrics = this.metrics.filter(metric => metric.name === name);
    if (matchingMetrics.length === 0) return 0;

    const totalTime = matchingMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    return totalTime / matchingMetrics.length;
  }

  generateReport(): string {
    if (this.metrics.length === 0) {
      return 'No performance metrics collected';
    }

    const slow = this.getSlowMetrics();
    const byType = {
      render: this.getMetricsByType('render'),
      interaction: this.getMetricsByType('interaction'),
      api: this.getMetricsByType('api'),
      computation: this.getMetricsByType('computation')
    };

    let report = '📊 Performance Report\n';
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Total metrics: ${this.metrics.length}\n`;
    report += `Slow operations (>100ms): ${slow.length}\n\n`;

    Object.entries(byType).forEach(([type, metrics]) => {
      if (metrics.length > 0) {
        const avg = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
        const max = Math.max(...metrics.map(m => m.duration));
        report += `${type.toUpperCase()}: ${metrics.length} metrics, avg: ${avg.toFixed(2)}ms, max: ${max.toFixed(2)}ms\n`;
      }
    });

    if (slow.length > 0) {
      report += `\n🐌 Slowest operations:\n`;
      slow
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5)
        .forEach(metric => {
          report += `  ${metric.name}: ${metric.duration.toFixed(2)}ms (${metric.type})\n`;
        });
    }

    return report;
  }

  clear() {
    this.metrics = [];
    this.timers.clear();
  }

  // React performance utilities
  logRenderTime(componentName: string, duration: number) {
    if (!this.isEnabled) return;

    this.metrics.push({
      name: `${componentName} render`,
      duration,
      timestamp: Date.now(),
      type: 'render'
    });

    if (duration > 16.67) {
      console.warn(`${componentName} render took ${duration.toFixed(2)}ms`);
    }
  }

  // Monitor React component re-renders
  trackReRender(componentName: string, props?: any) {
    if (!this.isEnabled) return;

    console.group(`🔄 ${componentName} re-render`);
    console.log('Timestamp:', new Date().toISOString());
    if (props) {
      console.log('Props:', props);
    }
    console.groupEnd();
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

// React hooks for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    startTimer: performanceMonitor.startTimer.bind(performanceMonitor),
    endTimer: performanceMonitor.endTimer.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
  };
};

// Higher-order component for tracking render performance
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name;

  const TrackedComponent = React.forwardRef<any, P>((props, ref) => {
    React.useEffect(() => {
      const startTime = performance.now();

      return () => {
        const endTime = performance.now();
        performanceMonitor.logRenderTime(displayName, endTime - startTime);
      };
    });

    return <WrappedComponent {...props} ref={ref} />;
  });

  TrackedComponent.displayName = `withPerformanceTracking(${displayName})`;
  return TrackedComponent;
}

// Hook for tracking component mount/unmount times
export const useComponentLifecycle = (componentName: string) => {
  React.useEffect(() => {
    const mountTime = performance.now();
    performanceMonitor.startTimer(`${componentName} mount`);

    return () => {
      performanceMonitor.endTimer(`${componentName} mount`, 'render');
      const unmountTime = performance.now();
      console.log(`${componentName} lifecycle: ${(unmountTime - mountTime).toFixed(2)}ms`);
    };
  }, [componentName]);
};

// Export performance observer for Web Vitals
export const observeWebVitals = () => {
  if (!('PerformanceObserver' in window)) return;

  // Observe layout shifts
  const clsObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry: any) => {
      if (entry.hadRecentInput) return;
      console.warn('Layout shift detected:', entry.value);
    });
  });

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('Could not observe layout shifts');
  }

  // Observe long tasks
  const longTaskObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
    });
  });

  try {
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  } catch (e) {
    console.warn('Could not observe long tasks');
  }
};

export default performanceMonitor;