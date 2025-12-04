-- CreateIndex
CREATE INDEX "form_fields_templateId_fieldOrder_idx" ON "form_fields"("templateId", "fieldOrder");

-- CreateIndex
CREATE INDEX "form_fields_templateId_isVisible_isEnabled_idx" ON "form_fields"("templateId", "isVisible", "isEnabled");
