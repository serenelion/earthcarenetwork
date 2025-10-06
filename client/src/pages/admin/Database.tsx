import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useTables,
  useTableSchema,
  useTableData,
  useCreateRecord,
  useUpdateRecord,
  useDeleteRecord,
  useBulkDelete,
  useExportTable,
  type TableInfo,
  type ColumnInfo,
} from "@/lib/admin-queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Database as DatabaseIcon,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ITEMS_PER_PAGE = 50;

export default function Database() {
  const { toast } = useToast();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const { data: tablesData, isLoading: isLoadingTables } = useTables();
  const { data: schemaData, isLoading: isLoadingSchema } = useTableSchema(selectedTable);
  const { data: tableData, isLoading: isLoadingData, refetch: refetchData } = useTableData(
    selectedTable,
    {
      limit: ITEMS_PER_PAGE,
      offset: page * ITEMS_PER_PAGE,
      orderBy: "created_at",
      orderDir: "desc",
    }
  );

  const createMutation = useCreateRecord(selectedTable || "");
  const updateMutation = useUpdateRecord(selectedTable || "");
  const deleteMutation = useDeleteRecord(selectedTable || "");
  const bulkDeleteMutation = useBulkDelete(selectedTable || "");
  const exportMutation = useExportTable(selectedTable || "");

  const tables = tablesData?.tables || [];
  const schema = schemaData;
  const rows = tableData?.rows || [];
  const total = tableData?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const editableColumns = useMemo(() => {
    if (!schema) return [];
    return schema.columns.filter(
      (col) => !col.isPrimaryKey && col.columnName !== "created_at" && col.columnName !== "updated_at"
    );
  }, [schema]);

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    setPage(0);
    setSelectedRows(new Set());
    setSearchTerm("");
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(rows.map((row) => row.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      toast({
        title: "Success",
        description: "Record created successfully",
      });
      setIsCreateDialogOpen(false);
      setFormData({});
      refetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create record",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async () => {
    if (!editingRecord) return;
    try {
      await updateMutation.mutateAsync({
        id: editingRecord.id,
        data: formData,
      });
      toast({
        title: "Success",
        description: "Record updated successfully",
      });
      setIsEditDialogOpen(false);
      setEditingRecord(null);
      setFormData({});
      refetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update record",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Success",
        description: "Record deleted successfully",
      });
      setDeleteRecordId(null);
      refetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete record",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteMutation.mutateAsync(Array.from(selectedRows));
      toast({
        title: "Success",
        description: `${selectedRows.size} records deleted successfully`,
      });
      setIsBulkDeleteOpen(false);
      setSelectedRows(new Set());
      refetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete records",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: "json" | "csv") => {
    try {
      await exportMutation.mutateAsync(format);
      toast({
        title: "Success",
        description: `Table exported as ${format.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export table",
        variant: "destructive",
      });
    }
  };

  const openCreateDialog = () => {
    setFormData({});
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (record: any) => {
    setEditingRecord(record);
    const initialData: Record<string, any> = {};
    editableColumns.forEach((col) => {
      initialData[col.columnName] = record[col.columnName];
    });
    setFormData(initialData);
    setIsEditDialogOpen(true);
  };

  const renderFormField = (column: ColumnInfo) => {
    const value = formData[column.columnName] || "";

    if (column.dataType.includes("boolean")) {
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={column.columnName}
            checked={!!value}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, [column.columnName]: checked })
            }
            data-testid={`checkbox-${column.columnName}`}
          />
          <Label htmlFor={column.columnName}>{column.columnName}</Label>
        </div>
      );
    }

    if (column.dataType.includes("text") || column.dataType.includes("varchar")) {
      return (
        <div className="space-y-2">
          <Label htmlFor={column.columnName}>{column.columnName}</Label>
          <Input
            id={column.columnName}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [column.columnName]: e.target.value })
            }
            placeholder={column.isNullable ? "Optional" : "Required"}
            data-testid={`input-${column.columnName}`}
          />
        </div>
      );
    }

    if (column.dataType.includes("integer") || column.dataType.includes("numeric")) {
      return (
        <div className="space-y-2">
          <Label htmlFor={column.columnName}>{column.columnName}</Label>
          <Input
            id={column.columnName}
            type="number"
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [column.columnName]: parseInt(e.target.value) || 0 })
            }
            placeholder={column.isNullable ? "Optional" : "Required"}
            data-testid={`input-${column.columnName}`}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={column.columnName}>{column.columnName}</Label>
        <Input
          id={column.columnName}
          value={value}
          onChange={(e) =>
            setFormData({ ...formData, [column.columnName]: e.target.value })
          }
          placeholder={column.dataType}
          data-testid={`input-${column.columnName}`}
        />
      </div>
    );
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "boolean") return value ? "✓" : "✗";
    if (typeof value === "object") return JSON.stringify(value);
    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 50) + "...";
    }
    return String(value);
  };

  return (
    <div className="p-6 space-y-6" data-testid="database-admin-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DatabaseIcon className="h-8 w-8" />
            Database Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage database tables, records, and configurations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-64">
          <Select value={selectedTable || ""} onValueChange={handleTableChange}>
            <SelectTrigger data-testid="select-table">
              <SelectValue placeholder="Select a table" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingTables ? (
                <div className="p-2">Loading tables...</div>
              ) : (
                tables.map((table) => (
                  <SelectItem key={table.tableName} value={table.tableName}>
                    {table.tableName} ({table.rowCount} rows)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedTable && (
          <>
            <Button
              onClick={openCreateDialog}
              disabled={createMutation.isPending}
              data-testid="button-create-record"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
            <Button
              variant="outline"
              onClick={() => refetchData()}
              disabled={isLoadingData}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("csv")}
              disabled={exportMutation.isPending}
              data-testid="button-export-csv"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("json")}
              disabled={exportMutation.isPending}
              data-testid="button-export-json"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            {selectedRows.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsBulkDeleteOpen(true)}
                disabled={bulkDeleteMutation.isPending}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedRows.size})
              </Button>
            )}
          </>
        )}
      </div>

      {selectedTable && (
        <div className="bg-card border rounded-lg">
          {isLoadingData || isLoadingSchema ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRows.size === rows.length && rows.length > 0}
                          onCheckedChange={handleSelectAll}
                          data-testid="checkbox-select-all"
                        />
                      </TableHead>
                      {schema?.columns.slice(0, 8).map((col) => (
                        <TableHead key={col.columnName}>
                          {col.columnName}
                          {col.isPrimaryKey && <Badge className="ml-2" variant="secondary">PK</Badge>}
                        </TableHead>
                      ))}
                      <TableHead className="w-32">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      rows.map((row) => (
                        <TableRow key={row.id} data-testid={`row-${row.id}`}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRows.has(row.id)}
                              onCheckedChange={(checked) =>
                                handleSelectRow(row.id, checked as boolean)
                              }
                              data-testid={`checkbox-row-${row.id}`}
                            />
                          </TableCell>
                          {schema?.columns.slice(0, 8).map((col) => (
                            <TableCell key={col.columnName}>
                              {formatCellValue(row[col.columnName])}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(row)}
                                data-testid={`button-edit-${row.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteRecordId(row.id)}
                                data-testid={`button-delete-${row.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages} ({total} total records)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 0}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages - 1}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Create Record</DialogTitle>
            <DialogDescription>
              Add a new record to {selectedTable}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96 pr-4">
            <div className="space-y-4">
              {editableColumns.map((col) => (
                <div key={col.columnName}>{renderFormField(col)}</div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              data-testid="button-cancel-create"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              data-testid="button-confirm-create"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
            <DialogDescription>
              Update record in {selectedTable}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96 pr-4">
            <div className="space-y-4">
              {editableColumns.map((col) => (
                <div key={col.columnName}>{renderFormField(col)}</div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending}
              data-testid="button-confirm-edit"
            >
              {updateMutation.isPending ? "Updating..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteRecordId} onOpenChange={() => setDeleteRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRecordId && handleDelete(deleteRecordId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Delete Records</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.size} records? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-bulk-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-bulk-delete"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
