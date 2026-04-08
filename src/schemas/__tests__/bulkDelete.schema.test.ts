import { describe, it, expect } from 'vitest';
import {
  bulkDeleteRequestSchema,
  bulkDeleteSelectionSchema,
  idsArraySchema,
  validateBulkDeleteIds,
  safeBulkDeleteValidation
} from '../bulkDelete.schema';

describe('bulkDelete.schema', () => {
  describe('bulkDeleteRequestSchema', () => {
    it('should accept valid array of IDs (1-100)', () => {
      const validData = { ids: [1, 2, 3, 4, 5] };
      const result = bulkDeleteRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toEqual([1, 2, 3, 4, 5]);
      }
    });

    it('should accept exactly 1 ID', () => {
      const validData = { ids: [42] };
      const result = bulkDeleteRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should accept exactly 100 IDs', () => {
      const validData = { ids: Array.from({ length: 100 }, (_, i) => i + 1) };
      const result = bulkDeleteRequestSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ids).toHaveLength(100);
      }
    });

    it('should reject empty array', () => {
      const invalidData = { ids: [] };
      const result = bulkDeleteRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues?.[0]?.message || result.error.message;
        expect(errorMessage).toContain('al menos un registro');
      }
    });

    it('should reject more than 100 IDs', () => {
      const invalidData = { ids: Array.from({ length: 101 }, (_, i) => i + 1) };
      const result = bulkDeleteRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues?.[0]?.message || result.error.message;
        expect(errorMessage).toContain('más de 100');
      }
    });

    it('should reject negative IDs', () => {
      const invalidData = { ids: [1, -5, 3] };
      const result = bulkDeleteRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues?.[0]?.message || result.error.message;
        expect(errorMessage).toContain('positivos');
      }
    });

    it('should reject zero ID', () => {
      const invalidData = { ids: [1, 0, 3] };
      const result = bulkDeleteRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues?.[0]?.message || result.error.message;
        expect(errorMessage).toContain('positivos');
      }
    });

    it('should reject non-integer IDs', () => {
      const invalidData = { ids: [1, 2.5, 3] };
      const result = bulkDeleteRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject duplicate IDs', () => {
      const invalidData = { ids: [1, 2, 3, 2, 5] };
      const result = bulkDeleteRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues?.[0]?.message || result.error.message;
        expect(errorMessage).toContain('duplicados');
      }
    });

    it('should reject non-number values', () => {
      const invalidData = { ids: [1, '2', 3] };
      const result = bulkDeleteRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject missing ids field', () => {
      const invalidData = {};
      const result = bulkDeleteRequestSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('bulkDeleteSelectionSchema', () => {
    it('should accept valid selection with confirmation', () => {
      const validData = {
        selectedIds: [1, 2, 3],
        confirmDelete: true
      };
      const result = bulkDeleteSelectionSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject when confirmDelete is false', () => {
      const invalidData = {
        selectedIds: [1, 2, 3],
        confirmDelete: false
      };
      const result = bulkDeleteSelectionSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues?.[0]?.message || result.error.message;
        expect(errorMessage).toContain('confirmar');
      }
    });

    it('should reject empty selectedIds', () => {
      const invalidData = {
        selectedIds: [],
        confirmDelete: true
      };
      const result = bulkDeleteSelectionSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues?.[0]?.message || result.error.message;
        expect(errorMessage).toContain('al menos un registro');
      }
    });

    it('should reject missing confirmDelete', () => {
      const invalidData = {
        selectedIds: [1, 2, 3]
      };
      const result = bulkDeleteSelectionSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe('idsArraySchema', () => {
    it('should accept valid array of positive integers', () => {
      const validData = [10, 20, 30];
      const result = idsArraySchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it('should reject empty array', () => {
      const invalidData: number[] = [];
      const result = idsArraySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject array with 101 elements', () => {
      const invalidData = Array.from({ length: 101 }, (_, i) => i + 1);
      const result = idsArraySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it('should reject duplicates', () => {
      const invalidData = [5, 10, 5, 20];
      const result = idsArraySchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues?.[0]?.message || result.error.message;
        expect(errorMessage).toContain('duplicados');
      }
    });
  });

  describe('validateBulkDeleteIds', () => {
    it('should return true for valid IDs', () => {
      const validIds = [1, 2, 3, 4, 5];
      expect(validateBulkDeleteIds(validIds)).toBe(true);
    });

    it('should throw error for empty array', () => {
      const invalidIds: number[] = [];
      expect(() => validateBulkDeleteIds(invalidIds)).toThrow();
    });

    it('should throw error for invalid IDs', () => {
      const invalidIds = [1, -5, 0];
      expect(() => validateBulkDeleteIds(invalidIds)).toThrow();
    });

    it('should throw error for duplicates', () => {
      const invalidIds = [1, 2, 3, 2];
      expect(() => validateBulkDeleteIds(invalidIds)).toThrow();
    });

    it('should throw error for more than 100 IDs', () => {
      const invalidIds = Array.from({ length: 101 }, (_, i) => i + 1);
      expect(() => validateBulkDeleteIds(invalidIds)).toThrow();
    });
  });

  describe('safeBulkDeleteValidation', () => {
    it('should return success for valid IDs', () => {
      const validIds = [1, 2, 3];
      const result = safeBulkDeleteValidation(validIds);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for empty array', () => {
      const invalidIds: number[] = [];
      const result = safeBulkDeleteValidation(invalidIds);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.toLowerCase()).toContain('al menos');
    });

    it('should return error for invalid IDs', () => {
      const invalidIds = [1, -5];
      const result = safeBulkDeleteValidation(invalidIds);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.toLowerCase()).toContain('positivo');
    });

    it('should return error for duplicates', () => {
      const invalidIds = [1, 2, 3, 2];
      const result = safeBulkDeleteValidation(invalidIds);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.toLowerCase()).toContain('duplicado');
    });

    it('should return error for more than 100 IDs', () => {
      const invalidIds = Array.from({ length: 101 }, (_, i) => i + 1);
      const result = safeBulkDeleteValidation(invalidIds);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.toLowerCase()).toContain('100');
    });

    it('should return first error when multiple validation failures', () => {
      const invalidIds = [0, -1, 2, 2]; // Zero, negative, and duplicate
      const result = safeBulkDeleteValidation(invalidIds);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Should return the first error encountered
    });
  });
});
