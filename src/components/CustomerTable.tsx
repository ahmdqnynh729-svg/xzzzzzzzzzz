import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Users } from 'lucide-react';
import { Pencil, Trash2, Search, Plus, UserPlus, Edit } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Customer {
  id: number;
  customer_name: string;
  mobile_number: number;
  line_type: number;
  charging_date: string | null;
  arrival_time: string | null;
  provider: string | null;
  ownership: string | null;
  payment_status: string;
  monthly_price: number | null;
  renewal_status: string;
  notes: string | null;
  arrival_time: string | null;
  provider: string | null;
  ownership: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerTableProps {
  onAddCustomer: () => void;
  onAddBulkCustomers: () => void;
  onBulkEdit: () => void;
  onEditCustomer: (customer: Customer) => void;
}

export default function CustomerTable({ onAddCustomer, onAddBulkCustomers, onBulkEdit, onEditCustomer }: CustomerTableProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "خطأ",
        description: `فشل في تحميل بيانات العملاء: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم بنجاح",
        description: "تم حذف العميل بنجاح",
      });

      fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "خطأ",
        description: `فشل في حذف العميل: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(customer.mobile_number).includes(searchTerm)
  );

  const getPaymentStatusBadge = (status: string) => {
    const variant = status === 'دفع' ? 'default' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getRenewalStatusBadge = (status: string) => {
    const variant = status === 'تم' ? 'default' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="shadow-lg bg-black/80 text-white border-gray-600">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-6 w-6" />
              إدارة العملاء
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={onAddCustomer}
                className="hover-scale bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
              >
                <Plus className="h-4 w-4 ml-2" />
                إضافة عميل
              </Button>
              <Button
                onClick={onAddBulkCustomers}
                variant="outline"
                className="hover-scale border-green-600 text-green-400 hover:bg-green-900/20"
              >
                <UserPlus className="h-4 w-4 ml-2" />
                إضافة متعددة
              </Button>
              <Button
                onClick={onBulkEdit}
                variant="outline"
                className="hover-scale border-purple-600 text-purple-400 hover:bg-purple-900/20"
              >
                <Edit className="h-4 w-4 ml-2" />
                تعديل جماعي
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="البحث بالاسم أو رقم الموبايل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-right bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="text-sm text-gray-400">
              إجمالي العملاء: {customers.length}
            </div>
          </div>

          <div className="rounded-md border border-gray-600 bg-gray-800/30">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600">
                  <TableHead className="text-gray-300">اسم العميل</TableHead>
                  <TableHead className="text-gray-300">رقم الموبايل</TableHead>
                  <TableHead className="text-gray-300">نوع الخط</TableHead>
                  <TableHead className="text-gray-300">تاريخ الشحن</TableHead>
                  <TableHead className="text-gray-300">حالة الدفع</TableHead>
                  <TableHead className="text-gray-300">السعر الشهري</TableHead>
                  <TableHead className="text-gray-300">حالة التجديد</TableHead>
                  <TableHead className="text-gray-300">مقدم الخدمة</TableHead>
                  <TableHead className="text-gray-300">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-400">
                      {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد عملاء'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="border-gray-600 hover:bg-gray-700/30">
                      <TableCell className="font-medium text-white">{customer.customer_name}</TableCell>
                      <TableCell className="text-gray-300">{customer.mobile_number}</TableCell>
                      <TableCell className="text-gray-300">{customer.line_type} جيجا</TableCell>
                      <TableCell className="text-gray-300">
                        {customer.charging_date ? new Date(customer.charging_date).toLocaleDateString('ar-EG') : '-'}
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(customer.payment_status)}</TableCell>
                      <TableCell className="text-gray-300">{customer.monthly_price ? `${customer.monthly_price} جنيه` : '-'}</TableCell>
                      <TableCell>{getRenewalStatusBadge(customer.renewal_status)}</TableCell>
                      <TableCell className="text-gray-300 capitalize">{customer.provider || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditCustomer(customer)}
                            className="hover-scale border-blue-600 text-blue-400 hover:bg-blue-900/20"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="hover-scale border-red-600 text-red-400 hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-800 border-gray-600">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">تأكيد الحذف</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  هل أنت متأكد من حذف العميل "{customer.customer_name}"؟ هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-700 text-white border-gray-600">إلغاء</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteCustomer(customer.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  حذف
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}