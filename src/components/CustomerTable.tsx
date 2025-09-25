import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Pencil, Trash2, Search } from 'lucide-react';

interface Customer {
  id: number;
  customer_name: string;
  mobile_number: string;
  line_type: string;
  charging_date: string | null;
  payment_status: string;
  monthly_price: number | null;
  renewal_status: string;
  arrival_time: string | null;
  provider: string | null;
  ownership: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: number) => void;
  loading?: boolean;
}

export default function CustomerTable({ customers, onEdit, onDelete, loading = false }: CustomerTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(customer =>
    customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile_number.includes(searchTerm)
  );

  const getPaymentStatusBadge = (status: string) => {
    const variant = status === 'مدفوع' ? 'default' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getRenewalStatusBadge = (status: string) => {
    const variant = status === 'تم' ? 'default' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="البحث بالاسم أو رقم الهاتف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>اسم العميل</TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead>نوع الخط</TableHead>
              <TableHead>تاريخ الشحن</TableHead>
              <TableHead>حالة الدفع</TableHead>
              <TableHead>السعر الشهري</TableHead>
              <TableHead>حالة التجديد</TableHead>
              <TableHead>مقدم الخدمة</TableHead>
              <TableHead>الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  لا توجد عملاء
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.customer_name}</TableCell>
                  <TableCell>{customer.mobile_number}</TableCell>
                  <TableCell>{customer.line_type}</TableCell>
                  <TableCell>
                    {customer.charging_date ? new Date(customer.charging_date).toLocaleDateString('ar-SA') : '-'}
                  </TableCell>
                  <TableCell>{getPaymentStatusBadge(customer.payment_status)}</TableCell>
                  <TableCell>{customer.monthly_price ? `${customer.monthly_price} ريال` : '-'}</TableCell>
                  <TableCell>{getRenewalStatusBadge(customer.renewal_status)}</TableCell>
                  <TableCell>{customer.provider || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(customer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}