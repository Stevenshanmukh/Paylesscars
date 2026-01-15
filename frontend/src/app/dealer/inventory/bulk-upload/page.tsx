'use client';

import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBulkUpload } from './hooks/useBulkUpload';
import { UploadDropzone, CSVPreview, ValidationResults, UploadProgress, UploadComplete } from './components/BulkUploadComponents';
import { downloadTemplate } from './utils/csvParser';
import { Download, FileText, ChevronRight, ChevronDown, ChevronUp, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type UploadStep = 'select' | 'preview' | 'uploading' | 'complete';

interface ColumnDef {
    name: string;
    type: string;
    description: string;
    example: string;
    options?: string[];
}

// CSV Column definitions matching the backend schema
const CSV_COLUMNS: { required: ColumnDef[]; optional: ColumnDef[] } = {
    required: [
        { name: 'vin', type: 'string', description: 'Vehicle Identification Number (17 characters, unique)', example: '1HGBH41JXMN109186' },
        { name: 'make', type: 'string', description: 'Manufacturer name', example: 'Honda' },
        { name: 'model', type: 'string', description: 'Vehicle model name', example: 'Accord' },
        { name: 'year', type: 'number', description: 'Model year (1900-2026)', example: '2024' },
        { name: 'price', type: 'number', description: 'Listing price in USD (no $ symbol)', example: '31500' },
        { name: 'mileage', type: 'number', description: 'Current odometer reading', example: '15420' },
    ],
    optional: [
        { name: 'trim', type: 'string', description: 'Trim level/package', example: 'EX-L' },
        { name: 'body_type', type: 'enum', description: 'Vehicle body style (default: sedan)', example: 'sedan', options: ['sedan', 'suv', 'truck', 'coupe', 'hatchback', 'convertible', 'van', 'wagon'] },
        { name: 'msrp', type: 'number', description: 'MSRP in USD (default: price + 10%)', example: '37000' },
        { name: 'floor_price', type: 'number', description: 'Minimum acceptable price (default: price)', example: '29000' },
        { name: 'transmission', type: 'enum', description: 'Transmission type (default: automatic)', example: 'automatic', options: ['automatic', 'manual', 'cvt'] },
        { name: 'fuel_type', type: 'enum', description: 'Fuel/power type (default: gasoline)', example: 'gasoline', options: ['gasoline', 'diesel', 'hybrid', 'electric', 'plugin_hybrid'] },
        { name: 'exterior_color', type: 'string', description: 'Exterior paint color', example: 'White Pearl' },
        { name: 'interior_color', type: 'string', description: 'Interior color/material', example: 'Black Leather' },
        { name: 'features', type: 'string', description: 'Comma-separated list of features', example: 'Sunroof, Heated Seats, Navigation' },
        { name: 'description', type: 'string', description: 'Vehicle description/notes', example: 'One owner, clean title.' },
        { name: 'status', type: 'enum', description: 'Listing status (default: active)', example: 'active', options: ['draft', 'active', 'pending_sale', 'sold', 'inactive'] },
        { name: 'image_url', type: 'string', description: 'Public URL to main vehicle image', example: 'https://example.com/car.jpg' },
    ]
};

export default function BulkUploadPage() {
    const [step, setStep] = useState<UploadStep>('select');
    const [file, setFile] = useState<File | null>(null);
    const [showFieldGuide, setShowFieldGuide] = useState(false);
    const {
        parsedData,
        validationResults,
        uploadProgress,
        uploadResults,
        parseCSV,
        validateData,
        uploadVehicles,
        reset,
    } = useBulkUpload();

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);
        const data = await parseCSV(selectedFile);
        if (data) {
            validateData(data);
            setStep('preview');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setStep('uploading');
        await uploadVehicles(file);
        setStep('complete');
    };

    const handleReset = () => {
        reset();
        setFile(null);
        setStep('select');
    };

    return (
        <PageContainer>
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Bulk Upload Vehicles</h1>
                <p className="text-muted-foreground mt-1">Upload multiple vehicles at once using a CSV file.</p>
            </div>

            <div className="max-w-6xl mx-auto space-y-8">

                {/* Step 1: Download Template & Field Guide */}
                {step === 'select' && (
                    <>
                        <Card className="border-border">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold flex items-center gap-2">
                                            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                            Download Template
                                        </h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Use our pre-formatted CSV template to ensure your data is processed correctly.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                                            <Download className="w-4 h-4" />
                                            Download CSV Template
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="gap-2"
                                            onClick={() => setShowFieldGuide(!showFieldGuide)}
                                        >
                                            <FileText className="w-4 h-4" />
                                            {showFieldGuide ? 'Hide' : 'View'} Field Guide
                                            {showFieldGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Comprehensive Field Guide */}
                        {showFieldGuide && (
                            <Card className="border-border border-2 border-primary/20 bg-primary/5">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Info className="w-5 h-5 text-primary" />
                                        CSV Column Reference Guide
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Your CSV must include all required columns. Column names are case-insensitive but must match exactly.
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Required Fields */}
                                    <div>
                                        <h3 className="font-semibold text-sm uppercase tracking-wider text-red-600 mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            Required Fields ({CSV_COLUMNS.required.length})
                                        </h3>
                                        <div className="bg-white rounded-lg border border-border overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b border-border">
                                                    <tr>
                                                        <th className="text-left p-3 font-semibold">Column Name</th>
                                                        <th className="text-left p-3 font-semibold">Type</th>
                                                        <th className="text-left p-3 font-semibold">Description</th>
                                                        <th className="text-left p-3 font-semibold">Example</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {CSV_COLUMNS.required.map(col => (
                                                        <tr key={col.name} className="hover:bg-slate-50">
                                                            <td className="p-3">
                                                                <code className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-mono text-xs">
                                                                    {col.name}
                                                                </code>
                                                            </td>
                                                            <td className="p-3 text-muted-foreground">{col.type}</td>
                                                            <td className="p-3">
                                                                {col.description}
                                                                {col.options && (
                                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                                        {col.options.map(opt => (
                                                                            <Badge key={opt} variant="outline" className="text-[10px]">
                                                                                {opt}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-3 font-mono text-xs text-slate-600">{col.example}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Optional Fields */}
                                    <div>
                                        <h3 className="font-semibold text-sm uppercase tracking-wider text-green-600 mb-3 flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            Optional Fields ({CSV_COLUMNS.optional.length})
                                        </h3>
                                        <div className="bg-white rounded-lg border border-border overflow-hidden">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b border-border">
                                                    <tr>
                                                        <th className="text-left p-3 font-semibold">Column Name</th>
                                                        <th className="text-left p-3 font-semibold">Type</th>
                                                        <th className="text-left p-3 font-semibold">Description</th>
                                                        <th className="text-left p-3 font-semibold">Example</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {CSV_COLUMNS.optional.map(col => (
                                                        <tr key={col.name} className="hover:bg-slate-50">
                                                            <td className="p-3">
                                                                <code className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono text-xs">
                                                                    {col.name}
                                                                </code>
                                                            </td>
                                                            <td className="p-3 text-muted-foreground">{col.type}</td>
                                                            <td className="p-3">
                                                                {col.description}
                                                                {col.options && (
                                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                                        {col.options.map(opt => (
                                                                            <Badge key={opt} variant="outline" className="text-[10px]">
                                                                                {opt}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="p-3 font-mono text-xs text-slate-600">{col.example}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Important Notes */}
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <h4 className="font-semibold text-amber-800 mb-2">⚠️ Important Notes</h4>
                                        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                                            <li><strong>VIN must be unique</strong> - Duplicate VINs will be rejected</li>
                                            <li><strong>Prices must be numbers only</strong> - No $ signs, commas, or decimals (e.g., 31500 not $31,500.00)</li>
                                            <li><strong>floor_price ≤ msrp</strong> and <strong>asking_price ≥ floor_price</strong> - Price constraints are enforced</li>
                                            <li><strong>body_type must match exactly</strong> - Use one of the allowed values shown above</li>
                                            <li><strong>features should be comma-separated</strong> - Each feature will be stored separately</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Reference (always visible when not showing full guide) */}
                        {!showFieldGuide && (
                            <div className="bg-muted/30 rounded-lg p-4 border border-border">
                                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                                    Required Columns
                                    <Badge variant="destructive" className="text-[10px]">{CSV_COLUMNS.required.length}</Badge>
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {CSV_COLUMNS.required.map(col => (
                                        <span key={col.name} className="bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded text-xs font-mono">
                                            {col.name}
                                        </span>
                                    ))}
                                </div>
                                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
                                    Optional Columns
                                    <Badge variant="secondary" className="text-[10px]">{CSV_COLUMNS.optional.length}</Badge>
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {CSV_COLUMNS.optional.map(col => (
                                        <span key={col.name} className="bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded text-xs font-mono">
                                            {col.name}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">
                                    Click "View Field Guide" above for detailed descriptions and examples.
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Step 2/3: Upload & Processing */}
                <Card className="border-border">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                {step === 'select' ? '2' : (step === 'preview' ? '3' : '4')}
                            </span>
                            {step === 'select' ? 'Upload CSV File' :
                                step === 'preview' ? 'Verify & Upload' :
                                    step === 'uploading' ? 'Processing...' : 'Upload Complete'}
                        </h2>

                        {step === 'select' && (
                            <UploadDropzone onFileSelect={handleFileSelect} />
                        )}

                        {step === 'preview' && validationResults && (
                            <>
                                <ValidationResults results={validationResults} />
                                <CSVPreview data={parsedData} validationResults={validationResults} />
                                <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-border">
                                    <Button variant="ghost" onClick={handleReset}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={validationResults.errorCount > 0}
                                        className="gap-2"
                                    >
                                        Upload {parsedData.length} Vehicles
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        )}

                        {step === 'uploading' && (
                            <UploadProgress progress={uploadProgress} />
                        )}

                        {step === 'complete' && uploadResults && (
                            <UploadComplete
                                results={uploadResults}
                                onUploadMore={handleReset}
                            />
                        )}
                    </CardContent>
                </Card>

            </div>
        </PageContainer>
    );
}

