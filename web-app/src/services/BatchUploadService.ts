// BatchUploadService for client-side CSV/Excel import and data management
// import * as XLSX from 'xlsx'; // Temporarily disabled due to WASM build issues
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

// Web storage implementation (IndexedDB wrapper)
const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
  },
  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key);
  },
};

export interface BatchChild {
  uniqueId: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  guardianName: string;
  guardianPhone?: string;
  location?: string;
  notes?: string;
  qrCode?: string;
  createdAt: string;
  measurements?: ChildMeasurement[];
}

export interface ChildMeasurement {
  id: string;
  childId: string;
  height: number;
  weight: number;
  headCircumference?: number;
  armCircumference?: number;
  zScores: {
    heightForAge: number;
    weightForAge: number;
    weightForHeight: number;
    bmiForAge: number;
  };
  nutritionalStatus: string;
  measuredAt: string;
  measuredBy?: string;
}

export interface BatchUploadResult {
  success: boolean;
  imported: number;
  errors: string[];
  children: BatchChild[];
}

export class BatchUploadService {
  private static readonly STORAGE_KEY = 'batch_children';
  private static readonly MEASUREMENTS_KEY = 'batch_measurements';

  /**
   * Import children from CSV/Excel file
   */
  async importFromFile(file: File): Promise<BatchUploadResult> {
    try {
      // Temporary fix: Handle CSV files only for now
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = await file.text();
        const rawData = this.parseCSV(text);
        return this.processRawData(rawData);
      }
      
      // For Excel files, return error for now
      return {
        success: false,
        imported: 0,
        errors: ['Excel files temporarily not supported. Please use CSV format.'],
        children: []
      };
      
      // TODO: Re-enable Excel support after fixing WASM build issues
      // const arrayBuffer = await file.arrayBuffer();
      // const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      // const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Failed to process file: ${error instanceof Error ? error.message : String(error)}`],
        children: []
      };
    }
  }

  /**
   * Parse CSV text into array of arrays
   */
  private parseCSV(text: string): any[][] {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      // Simple CSV parsing - handles basic cases
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  }

  /**
   * Process raw data array into BatchUploadResult
   */
  private async processRawData(rawData: any[][]): Promise<BatchUploadResult> {
    if (rawData.length < 2) {
      return {
        success: false,
        imported: 0,
        errors: ['File must contain at least a header row and one data row'],
        children: []
      };
    }

    const headers = rawData[0].map(h => String(h).toLowerCase().trim());
    const dataRows = rawData.slice(1);

    const children: BatchChild[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNum = i + 2; // +2 because we start from row 2 (after header)

      try {
        const child = await this.parseChildFromRow(headers, row, rowNum);
        if (child) {
          children.push(child);
        }
      } catch (error) {
        errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Save to storage
    if (children.length > 0) {
      await this.saveBatchChildren(children);
    }

    return {
      success: children.length > 0,
      imported: children.length,
      errors,
      children
    };
  }

  /**
   * Parse a single child from CSV row
   */
  private async parseChildFromRow(headers: string[], row: any[], rowNum: number): Promise<BatchChild | null> {
    const getValue = (fieldNames: string[]) => {
      for (const fieldName of fieldNames) {
        const index = headers.findIndex(h => h.includes(fieldName));
        if (index !== -1 && row[index] !== undefined && row[index] !== '') {
          return String(row[index]).trim();
        }
      }
      return null;
    };

    const name = getValue(['name', 'child_name', 'childname', 'full_name']);
    const dateOfBirth = getValue(['dob', 'date_of_birth', 'birth_date', 'birthdate']);
    const gender = getValue(['gender', 'sex']);
    const guardianName = getValue(['guardian', 'parent', 'guardian_name', 'parent_name']);

    if (!name) {
      throw new Error('Name is required');
    }

    if (!dateOfBirth) {
      throw new Error('Date of birth is required');
    }

    if (!gender || !['male', 'female', 'm', 'f'].includes(gender.toLowerCase())) {
      throw new Error('Gender must be male/female or m/f');
    }

    if (!guardianName) {
      throw new Error('Guardian name is required');
    }

    const uniqueId = uuidv4();
    const normalizedGender = gender.toLowerCase().startsWith('m') ? 'male' : 'female';

    const child: BatchChild = {
      uniqueId,
      name,
      dateOfBirth: this.formatDate(dateOfBirth),
      gender: normalizedGender,
      guardianName,
      guardianPhone: getValue(['phone', 'guardian_phone', 'contact', 'mobile']) || undefined,
      location: getValue(['location', 'address', 'village', 'area']) || undefined,
      notes: getValue(['notes', 'comments', 'remarks']) || undefined,
      createdAt: new Date().toISOString(),
      measurements: []
    };

    // Generate QR code
    try {
      child.qrCode = await QRCode.toDataURL(`CGM-${uniqueId}`, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.warn(`Failed to generate QR code for ${name}:`, error);
    }

    return child;
  }

  /**
   * Format date string to ISO format
   */
  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    return date.toISOString().split('T')[0];
  }

  /**
   * Save batch children to storage
   */
  async saveBatchChildren(children: BatchChild[]): Promise<void> {
    try {
      const existingData = await AsyncStorage.getItem(BatchUploadService.STORAGE_KEY);
      const existingChildren: BatchChild[] = existingData ? JSON.parse(existingData) : [];
      
      // Merge with existing, avoiding duplicates by uniqueId
      const existingIds = new Set(existingChildren.map(c => c.uniqueId));
      const newChildren = children.filter(c => !existingIds.has(c.uniqueId));
      
      const allChildren = [...existingChildren, ...newChildren];
      await AsyncStorage.setItem(BatchUploadService.STORAGE_KEY, JSON.stringify(allChildren));
    } catch (error) {
      throw new Error(`Failed to save children: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all batch children
   */
  async getAllBatchChildren(): Promise<BatchChild[]> {
    try {
      const data = await AsyncStorage.getItem(BatchUploadService.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get batch children:', error);
      return [];
    }
  }

  /**
   * Find child by unique ID
   */
  async findChildById(uniqueId: string): Promise<BatchChild | null> {
    try {
      const children = await this.getAllBatchChildren();
      return children.find(child => child.uniqueId === uniqueId) || null;
    } catch (error) {
      console.error('Failed to find child:', error);
      return null;
    }
  }

  /**
   * Search children by name or ID
   */
  async searchChildren(query: string): Promise<BatchChild[]> {
    try {
      const children = await this.getAllBatchChildren();
      const lowerQuery = query.toLowerCase();
      
      return children.filter(child => 
        child.name.toLowerCase().includes(lowerQuery) ||
        child.uniqueId.toLowerCase().includes(lowerQuery) ||
        child.guardianName.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Failed to search children:', error);
      return [];
    }
  }

  /**
   * Add measurement to child
   */
  async addMeasurement(childId: string, measurement: Omit<ChildMeasurement, 'id' | 'childId'>): Promise<void> {
    try {
      const children = await this.getAllBatchChildren();
      const childIndex = children.findIndex(c => c.uniqueId === childId);
      
      if (childIndex === -1) {
        throw new Error('Child not found');
      }

      const newMeasurement: ChildMeasurement = {
        id: uuidv4(),
        childId,
        ...measurement
      };

      children[childIndex].measurements = children[childIndex].measurements || [];
      children[childIndex].measurements.push(newMeasurement);

      await AsyncStorage.setItem(BatchUploadService.STORAGE_KEY, JSON.stringify(children));
    } catch (error) {
      throw new Error(`Failed to add measurement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export children and measurements to Excel
   * Temporarily disabled due to WASM build issues with XLSX
   */
  async exportToExcel(): Promise<void> {
    throw new Error('Excel export temporarily disabled. Please use CSV export instead.');
    /*
    try {
      const children = await this.getAllBatchChildren();
      
      if (children.length === 0) {
        throw new Error('No children data to export');
      }

      // Create children sheet
      const childrenData = children.map(child => ({
        'Unique ID': child.uniqueId,
        'Name': child.name,
        'Date of Birth': child.dateOfBirth,
        'Gender': child.gender,
        'Guardian Name': child.guardianName,
        'Guardian Phone': child.guardianPhone || '',
        'Location': child.location || '',
        'Notes': child.notes || '',
        'Created At': child.createdAt,
        'Total Measurements': child.measurements?.length || 0
      }));

      // Create measurements sheet
      const measurementsData: any[] = [];
      children.forEach(child => {
        if (child.measurements) {
          child.measurements.forEach(measurement => {
            measurementsData.push({
              'Child ID': child.uniqueId,
              'Child Name': child.name,
              'Height (cm)': measurement.height,
              'Weight (kg)': measurement.weight,
              'Head Circumference (cm)': measurement.headCircumference || '',
              'Arm Circumference (cm)': measurement.armCircumference || '',
              'Height-for-Age Z-Score': measurement.zScores.heightForAge,
              'Weight-for-Age Z-Score': measurement.zScores.weightForAge,
              'Weight-for-Height Z-Score': measurement.zScores.weightForHeight,
              'BMI-for-Age Z-Score': measurement.zScores.bmiForAge,
              'Nutritional Status': measurement.nutritionalStatus,
              'Measured At': measurement.measuredAt,
              'Measured By': measurement.measuredBy || ''
            });
          });
        }
      });

      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      const childrenSheet = XLSX.utils.json_to_sheet(childrenData);
      XLSX.utils.book_append_sheet(workbook, childrenSheet, 'Children');
      
      if (measurementsData.length > 0) {
        const measurementsSheet = XLSX.utils.json_to_sheet(measurementsData);
        XLSX.utils.book_append_sheet(workbook, measurementsSheet, 'Measurements');
      }

      // Download file
      const fileName = `cgm-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      throw new Error(`Failed to export to Excel: ${error instanceof Error ? error.message : String(error)}`);
    }
    */
  }

  /**
   * Generate sample CSV template
   * Temporarily disabled due to WASM build issues with XLSX
   */
  generateSampleCSV(): void {
    // Create CSV content manually
    const csvContent = [
      'Name,Date of Birth,Gender,Guardian Name,Guardian Phone,Location,Notes',
      'John Doe,2020-01-15,Male,Jane Doe,+1234567890,Village A,First screening',
      'Mary Smith,2019-06-20,Female,Bob Smith,+0987654321,Village B,Follow-up needed',
      'Ahmed Ali,2021-03-10,Male,Fatima Ali,+1122334455,Village C,'
    ].join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'cgm-batch-upload-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Clear all batch data
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(BatchUploadService.STORAGE_KEY);
      await AsyncStorage.removeItem(BatchUploadService.MEASUREMENTS_KEY);
    } catch (error) {
      throw new Error(`Failed to clear data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    totalChildren: number;
    totalMeasurements: number;
    childrenWithMeasurements: number;
    averageMeasurementsPerChild: number;
  }> {
    try {
      const children = await this.getAllBatchChildren();
      const totalChildren = children.length;
      const totalMeasurements = children.reduce((sum, child) => sum + (child.measurements?.length || 0), 0);
      const childrenWithMeasurements = children.filter(child => (child.measurements?.length || 0) > 0).length;
      const averageMeasurementsPerChild = totalChildren > 0 ? totalMeasurements / totalChildren : 0;

      return {
        totalChildren,
        totalMeasurements,
        childrenWithMeasurements,
        averageMeasurementsPerChild: Math.round(averageMeasurementsPerChild * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalChildren: 0,
        totalMeasurements: 0,
        childrenWithMeasurements: 0,
        averageMeasurementsPerChild: 0
      };
    }
  }
}

export default new BatchUploadService();
export { BatchUploadService as BatchUploadServiceClass };