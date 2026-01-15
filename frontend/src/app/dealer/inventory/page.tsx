'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Upload, Search, Filter, MoreHorizontal, Edit, Eye, Trash, Ban, Archive, RotateCcw, CheckCircle, Tag } from 'lucide-react';
import { toast } from 'sonner';

import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { vehicleApi } from '@/lib/api/vehicles';
import { Vehicle } from '@/lib/types/vehicle';
import { formatPrice } from '@/lib/utils';

export default function DealerInventoryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            const data = await vehicleApi.getMyInventory();
            setVehicles(data);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handleStatusUpdate = async (id: string, newStatus: string, successMessage: string) => {
        try {
            await vehicleApi.update(id, { status: newStatus });
            toast.success(successMessage);
            fetchInventory();
        } catch (error) {
            console.error(`Failed to update status to ${newStatus}:`, error);
            toast.error('Failed to update status');
        }
    };

    const handlePublish = (id: string) => handleStatusUpdate(id, 'active', 'Vehicle published successfully');
    const handleDeactivate = (id: string) => handleStatusUpdate(id, 'inactive', 'Vehicle deactivated');
    const handleReactivate = (id: string) => handleStatusUpdate(id, 'active', 'Vehicle reactivated');
    const handleMarkSold = (id: string) => handleStatusUpdate(id, 'sold', 'Vehicle marked as sold');
    const handleCancelSale = (id: string) => handleStatusUpdate(id, 'active', 'Sale cancelled, vehicle reactivated');
    const handleRelist = (id: string) => handleStatusUpdate(id, 'active', 'Vehicle relisted and now active');

    const handleDelete = async () => {
        if (!vehicleToDelete) return;
        try {
            setIsDeleting(true);
            await vehicleApi.delete(vehicleToDelete.id);
            toast.success('Vehicle deleted successfully');
            setVehicleToDelete(null);
            fetchInventory();
        } catch (error) {
            console.error('Failed to delete vehicle:', error);
            toast.error('Failed to delete vehicle');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredVehicles = vehicles.filter((vehicle) => {
        const matchesSearch =
            vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.year.toString().includes(searchQuery);

        const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 hover:bg-green-100';
            case 'pending_sale': return 'bg-orange-100 text-orange-700 hover:bg-orange-100';
            case 'sold': return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
            case 'inactive': return 'bg-gray-100 text-gray-700 hover:bg-gray-100';
            case 'draft': return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatStatus = (status: string) => {
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <PageContainer title="My Inventory" description="Manage your vehicle listings">
            <div className="flex flex-col space-y-4">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex gap-2 flex-1">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search make, model, year..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="pending_sale">Pending Sale</SelectItem>
                                <SelectItem value="sold">Sold</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/dealer/inventory/bulk-upload">
                            <Button variant="outline">
                                <Upload className="w-4 h-4 mr-2" />
                                Bulk Upload
                            </Button>
                        </Link>
                        <Link href="/dealer/inventory/new">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Vehicle
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Inventory Table */}
                <div className="border rounded-lg overflow-hidden bg-card shadow-sm">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="h-12 bg-muted/20 animate-pulse rounded" />
                            ))}
                        </div>
                    ) : filteredVehicles.length === 0 ? (
                        <EmptyState
                            title="No vehicles found"
                            message={searchQuery ? "No vehicles match your search." : "You haven't listed any vehicles yet."}
                            actionLabel="Add your first vehicle"
                            actionLink="/dealer/inventory/new"
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-3">Vehicle</th>
                                        <th className="px-6 py-3">Price</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Date Added</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredVehicles.map((vehicle) => (
                                        <tr key={vehicle.id} className="bg-card border-b border-border hover:bg-muted/50">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                                <div className="flex items-center gap-3">
                                                    {/* Image Thumbnail */}
                                                    <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                                                        {vehicle.images && vehicle.images.length > 0 ? (
                                                            <img
                                                                src={vehicle.images[0].image}
                                                                alt={vehicle.model}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                                <Search className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold">
                                                            {vehicle.year} {vehicle.make} {vehicle.model}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {vehicle.trim}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {formatPrice(vehicle.asking_price)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Select
                                                    value={vehicle.status}
                                                    onValueChange={(newStatus) => {
                                                        const messages: Record<string, string> = {
                                                            active: 'Vehicle is now active',
                                                            inactive: 'Vehicle deactivated',
                                                            draft: 'Vehicle moved to draft',
                                                            pending_sale: 'Vehicle marked as pending sale',
                                                            sold: 'Vehicle marked as sold',
                                                        };
                                                        handleStatusUpdate(vehicle.id, newStatus, messages[newStatus] || 'Status updated');
                                                    }}
                                                >
                                                    <SelectTrigger className={`w-[140px] h-8 text-xs ${getStatusColor(vehicle.status)}`}>
                                                        <SelectValue>{formatStatus(vehicle.status)}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="pending_sale">Pending Sale</SelectItem>
                                                        <SelectItem value="sold">Sold</SelectItem>
                                                        <SelectItem value="inactive">Inactive</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(vehicle.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <Link href={`/dealer/inventory/new?edit=${vehicle.id}`}>
                                                            <DropdownMenuItem>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <Link href={`/vehicles/${vehicle.id}`}>
                                                            <DropdownMenuItem>
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Listing
                                                            </DropdownMenuItem>
                                                        </Link>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => setVehicleToDelete(vehicle)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!vehicleToDelete} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Vehicle</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold">
                                {vehicleToDelete?.year} {vehicleToDelete?.make} {vehicleToDelete?.model}
                            </span>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setVehicleToDelete(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PageContainer>
    );
}
