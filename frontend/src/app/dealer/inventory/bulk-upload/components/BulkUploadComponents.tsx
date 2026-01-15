import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CSVVehicle } from '../utils/csvParser';
import { ValidationResult } from '../utils/csvValidator';

// --- UploadDropzone ---
export function UploadDropzone({ onFileSelect }: { onFileSelect: (file: File) => void }) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                onFileSelect(file);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div
            className={cn(
                "border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleChange}
            />
            <div className="flex flex-col items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-full">
                    <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Drag & Drop CSV Here</h3>
                    <p className="text-muted-foreground mt-1">or click to browse files</p>
                </div>
                <p className="text-xs text-muted-foreground">Accepted: .csv (Max 5MB)</p>
            </div>
        </div>
    );
}

// --- ValidationResults ---
export function ValidationResults({ results }: { results: ValidationResult }) {
    if (!results) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-200 dark:border-green-900/50 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                    <p className="font-semibold text-green-700 dark:text-green-400">{results.validCount} vehicles</p>
                    <p className="text-xs text-green-600/80">Ready to upload</p>
                </div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/50 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                    <p className="font-semibold text-yellow-700 dark:text-yellow-400">{results.warningCount} warnings</p>
                    <p className="text-xs text-yellow-600/80">Will be auto-corrected</p>
                </div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-200 dark:border-red-900/50 flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                    <p className="font-semibold text-red-700 dark:text-red-400">{results.errorCount} errors</p>
                    <p className="text-xs text-red-600/80">Must be fixed</p>
                </div>
            </div>
        </div>
    );
}

// --- CSVPreview ---
export function CSVPreview({ data, validationResults }: { data: CSVVehicle[], validationResults: ValidationResult }) {
    const errorRows = new Set(validationResults.errors.map(e => e.row));
    const warningRows = new Set(validationResults.warnings.map(w => w.row));

    const [expanded, setExpanded] = useState(false);
    const previewData = expanded ? data : data.slice(0, 5);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Preview Data
                </h3>
                {data.length > 5 && (
                    <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                        {expanded ? 'Show Less' : `Show All (${data.length})`}
                    </Button>
                )}
            </div>

            <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-4 py-2 font-medium w-12">#</th>
                            <th className="px-4 py-2 font-medium">VIN</th>
                            <th className="px-4 py-2 font-medium">Make</th>
                            <th className="px-4 py-2 font-medium">Model</th>
                            <th className="px-4 py-2 font-medium">Year</th>
                            <th className="px-4 py-2 font-medium">Price</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                            <th className="px-4 py-2 font-medium">State</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {previewData.map((row, i) => {
                            const rowNum = i + 2;
                            const hasError = errorRows.has(rowNum);
                            const hasWarning = warningRows.has(rowNum);

                            return (
                                <tr key={i} className={cn(
                                    hasError ? "bg-red-50/50 dark:bg-red-900/10" :
                                        hasWarning ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""
                                )}>
                                    <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                                    <td className="px-4 py-2 font-mono text-xs">{row.vin}</td>
                                    <td className="px-4 py-2">{row.make}</td>
                                    <td className="px-4 py-2">{row.model}</td>
                                    <td className="px-4 py-2">{row.year}</td>
                                    <td className="px-4 py-2">{row.price}</td>
                                    <td className="px-4 py-2 capitalize">{row.status}</td>
                                    <td className="px-4 py-2">
                                        {hasError ? <XCircle className="w-4 h-4 text-red-500" /> :
                                            hasWarning ? <AlertTriangle className="w-4 h-4 text-yellow-500" /> :
                                                <CheckCircle className="w-4 h-4 text-green-500" />}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {validationResults.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Issues to Resolve
                    </h4>
                    <ul className="space-y-1 text-sm text-red-700 dark:text-red-500 max-h-40 overflow-y-auto">
                        {validationResults.errors.map((err, i) => (
                            <li key={i}>Row {err.row}: {err.message}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

// --- UploadProgress ---
export function UploadProgress({ progress }: { progress: any }) {
    const percent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

    return (
        <div className="py-12 px-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
            <div className="w-full bg-muted rounded-full h-4 mb-4 overflow-hidden">
                <div
                    className="bg-primary h-full transition-all duration-300 ease-out"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <h3 className="text-xl font-bold mb-2">
                {progress.status === 'complete' ? 'Upload Complete!' : 'Uploading Vehicles...'}
            </h3>
            <p className="text-muted-foreground">
                {progress.status === 'uploading'
                    ? `Processing file... (This may take a moment)`
                    : progress.status === 'complete'
                        ? 'All done!'
                        : 'Waiting...'}
            </p>
        </div>
    );
}

// --- Step 4: Complete ---
export function UploadComplete({ results, onUploadMore }: { results: any, onUploadMore: () => void }) {
    if (!results) return null;

    const downloadErrors = () => {
        if (!results.errors || results.errors.length === 0) return;
        const headers = ['Row', 'VIN', 'Error'];
        const csvContent = [
            headers.join(','),
            ...results.errors.map((err: { row: number; vin: string; error: string }) =>
                `${err.row},"${err.vin || 'N/A'},"${err.error.replace(/"/g, '""')}`
            )
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `upload_errors_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="text-center py-8">
            <div className="flex justify-center mb-6">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">Upload Complete!</h2>
            <p className="text-muted-foreground mb-4">Processed {results.total} rows</p>

            <div className="flex justify-center gap-6 mb-6 text-sm">
                <div className="text-green-600">
                    <span className="font-bold text-lg">{results.successful}</span> Successful
                </div>
                <div className="text-red-600">
                    <span className="font-bold text-lg">{results.failed}</span> Failed
                </div>
            </div>

            {results.errors && results.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-lg p-4 mb-6 max-w-xl mx-auto text-left">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-red-800 dark:text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Failed Rows
                        </h4>
                        <Button size="sm" variant="outline" onClick={downloadErrors} className="text-red-600">
                            Download Errors CSV
                        </Button>
                    </div>
                    <ul className="space-y-1 text-sm text-red-700 dark:text-red-500 max-h-32 overflow-y-auto">
                        {results.errors.slice(0, 5).map((err: { row: number; vin: string; error: string }, i: number) => (
                            <li key={i}>Row {err.row}: {err.error}</li>
                        ))}
                        {results.errors.length > 5 && (
                            <li className="text-muted-foreground">...and {results.errors.length - 5} more</li>
                        )}
                    </ul>
                </div>
            )}

            <div className="flex justify-center gap-4">
                <Button onClick={onUploadMore} variant="outline">Upload More</Button>
                <Button onClick={() => window.location.href = '/dealer/inventory'}>View Inventory</Button>
            </div>
        </div>
    );
}
