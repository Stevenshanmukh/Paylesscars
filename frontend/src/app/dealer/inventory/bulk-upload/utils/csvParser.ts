import Papa from 'papaparse';

export interface CSVVehicle {
    vin: string;
    make: string;
    model: string;
    year: string;
    trim?: string;
    body_type?: string;
    price: string;
    msrp?: string;
    floor_price?: string;
    mileage: string;
    transmission?: string;
    fuel_type?: string;
    exterior_color?: string;
    interior_color?: string;
    features?: string;
    description?: string;
    image_url?: string;
    status: string;
    [key: string]: string | undefined;
}

export interface ParseResult {
    data: CSVVehicle[];
    errors: Papa.ParseError[];
    meta: Papa.ParseMeta;
}

export function parseCSV(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
            complete: (results) => {
                resolve({
                    data: results.data as CSVVehicle[],
                    errors: results.errors,
                    meta: results.meta,
                });
            },
            error: (error) => {
                reject(error);
            },
        });
    });
}

export function generateCSVTemplate(): string {
    const headers = [
        'vin',
        'make',
        'model',
        'year',
        'trim',
        'body_type',
        'price',
        'msrp',
        'floor_price',
        'mileage',
        'transmission',
        'fuel_type',
        'exterior_color',
        'interior_color',
        'features',
        'description',
        'status',
        'image_url'
    ];

    const sampleRow = [
        '1HGCV1F34LA123456',
        'Honda',
        'Accord',
        '2025',
        'EX-L',
        'sedan',
        '35500',
        '37000',
        '33000',
        '15000',
        'automatic',
        'gasoline',
        'White Pearl',
        'Black Leather',
        '"Sunroof, Heated Seats, Navigation"',
        'One owner clean title',
        'active',
        'https://example.com/car-image.jpg'
    ];

    return `${headers.join(',')}\n${sampleRow.join(',')}`;
}

export function downloadTemplate() {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicle_upload_template.csv';
    a.click();
    URL.revokeObjectURL(url);
}
