import { CSVVehicle } from './csvParser';

export interface ValidationError {
    row: number;
    field: string;
    message: string;
    severity: 'error' | 'warning';
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
    validCount: number;
    errorCount: number;
    warningCount: number;
}

const REQUIRED_FIELDS = ['vin', 'make', 'model', 'year', 'price', 'mileage'];

const VALID_BODY_TYPES = ['sedan', 'suv', 'truck', 'coupe', 'van', 'wagon', 'convertible', 'hatchback'];
const VALID_TRANSMISSIONS = ['automatic', 'manual', 'cvt'];
const VALID_FUEL_TYPES = ['gasoline', 'diesel', 'hybrid', 'electric', 'plugin_hybrid'];
const VALID_STATUSES = ['active', 'pending', 'draft', 'sold'];

export function validateCSVData(data: CSVVehicle[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const seenVINs = new Set<string>();

    data.forEach((row, index) => {
        const rowNum = index + 2; // +2 for header row and 0-index

        // Check required fields
        REQUIRED_FIELDS.forEach((field) => {
            if (!row[field as keyof CSVVehicle] || row[field as keyof CSVVehicle]?.trim() === '') {
                errors.push({
                    row: rowNum,
                    field,
                    message: `${field} is required`,
                    severity: 'error',
                });
            }
        });

        // Validate VIN
        if (row.vin) {
            if (row.vin.length !== 17) {
                errors.push({
                    row: rowNum,
                    field: 'vin',
                    message: `VIN must be exactly 17 characters (got ${row.vin.length})`,
                    severity: 'error',
                });
            }
            if (seenVINs.has(row.vin)) {
                errors.push({
                    row: rowNum,
                    field: 'vin',
                    message: 'Duplicate VIN in file',
                    severity: 'error',
                });
            }
            seenVINs.add(row.vin);
        }

        // Validate year
        if (row.year) {
            const year = parseInt(row.year, 10);
            if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
                errors.push({
                    row: rowNum,
                    field: 'year',
                    message: `Invalid year: ${row.year}`,
                    severity: 'error',
                });
            }
        }

        // Validate price
        if (row.price) {
            const price = parseFloat(row.price.replace(/[$,]/g, ''));
            if (isNaN(price) || price <= 0) {
                errors.push({
                    row: rowNum,
                    field: 'price',
                    message: `Price must be a positive number`,
                    severity: 'error',
                });
            }
        }

        // Validate mileage
        if (row.mileage) {
            const mileage = parseInt(row.mileage.replace(/,/g, ''), 10);
            if (isNaN(mileage) || mileage < 0) {
                errors.push({
                    row: rowNum,
                    field: 'mileage',
                    message: `Mileage must be 0 or greater`,
                    severity: 'error',
                });
            }
        }

        // Validate status
        if (row.status && !VALID_STATUSES.includes(row.status.toLowerCase())) {
            errors.push({
                row: rowNum,
                field: 'status',
                message: `Invalid status. Use: ${VALID_STATUSES.join(', ')}`,
                severity: 'error',
            });
        }

        // Validate optional fields with warnings
        if (row.body_type && !VALID_BODY_TYPES.includes(row.body_type.toLowerCase())) {
            warnings.push({
                row: rowNum,
                field: 'body_type',
                message: `Unknown body type: ${row.body_type}. Will default to 'sedan'.`,
                severity: 'warning',
            });
        }

        if (row.transmission && !VALID_TRANSMISSIONS.includes(row.transmission.toLowerCase())) {
            warnings.push({
                row: rowNum,
                field: 'transmission',
                message: `Unknown transmission: ${row.transmission}. Will default to 'automatic'.`,
                severity: 'warning',
            });
        }

        if (row.fuel_type && !VALID_FUEL_TYPES.includes(row.fuel_type.toLowerCase())) {
            warnings.push({
                row: rowNum,
                field: 'fuel_type',
                message: `Unknown fuel type: ${row.fuel_type}. Will default to 'gasoline'.`,
                severity: 'warning',
            });
        }

        // Validate description length
        if (row.description && row.description.length > 2000) {
            warnings.push({
                row: rowNum,
                field: 'description',
                message: `Description exceeds 2000 characters. Will be truncated.`,
                severity: 'warning',
            });
        }

        // Validate floor_price < price
        if (row.floor_price && row.price) {
            const floor = parseFloat(row.floor_price.replace(/[$,]/g, ''));
            const price = parseFloat(row.price.replace(/[$,]/g, ''));
            if (floor > price) {
                warnings.push({
                    row: rowNum,
                    field: 'floor_price',
                    message: `Floor price ($${floor}) is higher than listing price ($${price})`,
                    severity: 'warning',
                });
            }
        }

        // Validate image_url
        if (row.image_url) {
            try {
                new URL(row.image_url);
            } catch {
                warnings.push({
                    row: rowNum,
                    field: 'image_url',
                    message: `Invalid image URL format`,
                    severity: 'warning',
                });
            }
        }
    });

    const rowsWithErrors = new Set(errors.map((e) => e.row));
    const validCount = data.length - rowsWithErrors.size;

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        validCount,
        errorCount: rowsWithErrors.size,
        warningCount: new Set(warnings.map((w) => w.row)).size,
    };
}
