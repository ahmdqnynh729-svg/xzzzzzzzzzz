import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Calendar, Wifi, Edit, Save, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

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
  notes?: string | null;
}

interface SuggestedName {
  id: string;
  mobile_number: string;
  suggested_name: string;
  created_at: string;
  updated_at: string;
}
interface SuggestedName {
  id: string;
  mobile_number: string;
  suggested_name: string;
  created_at: string;
  updated_at: string;
}
interface UserDashboardProps {
  userType: string;
  username: string;
}

export const UserDashboard = ({ userType, username }: UserDashboardProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suggestedNames, setSuggestedNames] = useState<SuggestedName[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [suggestedName, setSuggestedName] = useState("");
  const [tempName, setTempName] = useState("");
  const [loadingSuggestedName, setLoadingSuggestedName] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomerData();
    fetchSuggestedName();
    if (userType === "multiple") {
      fetchSuggestedNames();
    }
  }, [userType, username]);

  const fetchSuggestedName = async () => {
    if (userType !== "single") {
      setLoadingSuggestedName(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('suggested_names')
        .select('*')
        .eq('mobile_number', username)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSuggestedName(data.suggested_name);
      } else {
        setSuggestedName("");
      }
    } catch (error) {
      console.error('Error fetching suggested name:', error);
    } finally {
      setLoadingSuggestedName(false);
    }
  };

  const fetchSuggestedNames = async () => {
    try {
      const { data, error } = await supabase
        .from('suggested_names')
        .select('*');

      if (error) throw error;
      setSuggestedNames(data || []);
    } catch (error) {
      console.error('Error fetching suggested names:', error);
    }
  };

  const getSuggestedName = (mobileNumber: number): string | null => {
    const suggested = suggestedNames.find(s => s.mobile_number === String(mobileNumber));
    return suggested ? suggested.suggested_name : null;
  };
  const saveSuggestedName = async () => {
    if (!tempName.trim()) return;

    try {
      const { error } = await supabase
        .from('suggested_names')
        .upsert({
          mobile_number: username,
          suggested_name: tempName.trim()
        }, {
          onConflict: 'mobile_number'
        });

      if (error) throw error;

      setSuggestedName(tempName.trim());
      setIsEditingName(false);
      setTempName("");
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الاسم المقترح بنجاح",
      });
    } catch (error) {
      console.error('Error saving suggested name:', error);
      toast({
        title: "خطأ",
        description: `فشل في حفظ الاسم المقترح: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const startEditing = () => {
    setTempName(suggestedName);
    setIsEditingName(true);
  };

  const cancelEditing = () => {
    setTempName("");
    setIsEditingName(false);
  };

  const fetchCustomerData = async () => {
    try {
      let query = supabase.from('customers').select(`
        id, customer_name, mobile_number, line_type, charging_date, 
        arrival_time, provider, ownership, payment_status, 
        monthly_price, renewal_status, created_at, updated_at
      `);
      
      if (userType === "multiple") {
        // For multiple user, filter by customer name
        query = query.eq('customer_name', username)
          .order('charging_date', { ascending: false })
          .order('line_type', { ascending: true });
      } else if (userType === "single") {
        // For single user, filter by mobile number
        query = query.eq('mobile_number', parseInt(username));
      }

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseDateAssume2025 = (dateString: string | null): Date | null => {
    if (!dateString) return null;

    const iso = /^\d{4}-\d{2}-\d{2}$/;
    const ymdSlash = /^\d{4}\/\d{2}\/\d{2}$/;
    const dmySlash = /^\d{2}\/\d{2}\/\d{4}$/;
    const dMon = /^(\d{1,2})-(\w{3})$/i;

    if (iso.test(dateString)) return new Date(dateString + 'T00:00:00Z');
    if (ymdSlash.test(dateString)) return new Date(dateString.replace(/\//g, '-') + 'T00:00:00Z');
    if (dmySlash.test(dateString)) {
      const [dd, mm, yyyy] = dateString.split('/');
      return new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    }

    const m = dateString.match(dMon);
    if (m) {
      const day = parseInt(m[1], 10);
      const monAbbr = m[2].toLowerCase();
      const map: Record<string, number> = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
      const month = map[monAbbr];
      if (month) return new Date(Date.UTC(2025, month - 1, day));
    }

    const d = new Date(dateString);
    if (!isNaN(d.getTime())) return d;
    return null;
  };

  const formatDate = (dateString: string | null) => {
    const d = parseDateAssume2025(dateString);
    if (!d) return 'غير محدد';
    return d.toLocaleDateString('ar-EG');
  };

  const computeRenewalDate = (charging: string | null, existingRenewal: string | null): Date | null => {
    const existing = parseDateAssume2025(existingRenewal);
    if (existing) return existing;
    const base = parseDateAssume2025(charging);
    if (!base) return null;
    const result = new Date(base);
    result.setUTCDate(result.getUTCDate() + 30);
    return result;
  };

  const formatRenewal = (charging: string | null, renewal: string | null) => {
    const existing = parseDateAssume2025(renewal);
    if (existing) return existing.toLocaleDateString('ar-EG');
    
    const base = parseDateAssume2025(charging);
    if (!base) return 'غير محدد';
    
    const result = new Date(base);
    result.setUTCDate(result.getUTCDate() + 30);
    
    const d = result;
    if (!d) return 'غير محدد';
    return d.toLocaleDateString('ar-EG');
  };

  const formatRenewalWithProvider = (charging: string | null, renewal: string | null, provider: string | null) => {
    const existing = parseDateAssume2025(renewal);
    if (existing) return existing.toLocaleDateString('ar-EG');
    
    const base = parseDateAssume2025(charging);
    if (!base) return 'غير محدد';
    
    const result = new Date(base);
    // Etisalat: 28 days (renewal on day 29)
    // Orange: 30 days (renewal on day 31)
    // WE: 30 days (renewal on day 31)
    if (provider === 'etisalat') {
      result.setUTCDate(result.getUTCDate() + 28);
    } else {
      result.setUTCDate(result.getUTCDate() + 30);
    }
    
    return result.toLocaleDateString('ar-EG');
  };

  const getRenewalAlert = (charging: string | null, renewal: string | null, provider: string | null) => {
    const existing = parseDateAssume2025(renewal);
    let renewalDate: Date;
    
    if (existing) {
      renewalDate = existing;
    } else {
      const base = parseDateAssume2025(charging);
      if (!base) return null;
      
      renewalDate = new Date(base);
      if (provider === 'etisalat') {
        renewalDate.setUTCDate(renewalDate.getUTCDate() + 28);
      } else {
        renewalDate.setUTCDate(renewalDate.getUTCDate() + 30);
      }
    }
    
    const today = new Date();
    const timeDiff = renewalDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff <= 2 && daysDiff >= 0) {
      return {
        show: true,
        daysLeft: daysDiff,
        isToday: daysDiff === 0,
        isTomorrow: daysDiff === 1
      };
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="text-muted-foreground text-lg">لا توجد بيانات متاحة</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in transition-all duration-500">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-green-600">
          مرحباً {userType === "single" && customers.length > 0 ? 
            (getSuggestedName(customers[0].mobile_number) || customers[0].customer_name) : 
            username}
        </h2>
        
        {/* Suggested Name Section */}
        {userType === "single" && (
          <div className="mt-4 space-y-2">
            {loadingSuggestedName ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
            ) : (
              !isEditingName ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="text-lg text-muted-foreground">
                    {suggestedName ? (
                      <span>الاسم المقترح: <span className="text-blue-600 font-semibold">{suggestedName}</span></span>
                    ) : (
                      <span>لا يوجد اسم مقترح</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={startEditing}
                    className="hover-scale"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="أدخل الاسم المقترح..."
                    className="text-center"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        saveSuggestedName();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={saveSuggestedName}
                    className="hover-scale text-green-600"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    className="hover-scale text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}
          </div>
        )}
        
        <p className="text-muted-foreground text-lg">
          {userType === "multiple" ? "بيانات خطوطك" : "بيانات خطك"}
        </p>
      </div>

      <div className="grid gap-6">
        {customers.map((customer, index) => (
          <Card key={customer.id} className="animate-fade-in shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-l-4 border-l-blue-500 bg-black/80 text-white border-gray-600" style={{ animationDelay: `${index * 0.1}s` }}>
            <CardHeader>
              <CardTitle className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-blue-600" />
                  بيانات الخط
                  {userType === "multiple" && getSuggestedName(customer.mobile_number) && (
                    <span className="text-sm text-blue-400 font-normal">
                      ({getSuggestedName(customer.mobile_number)})
                    </span>
                  )}
                </div>
                {(() => {
                  const alert = getRenewalAlert(customer.charging_date, null, customer.provider);
                  if (alert?.show) {
                    return (
                      <Badge 
                        variant="destructive" 
                        className="self-start animate-pulse bg-red-600 text-white border-red-500"
                      >
                        {alert.isToday ? 'التجديد اليوم!' : 
                         alert.isTomorrow ? 'التجديد غداً!' : 
                         `باقي ${alert.daysLeft} يوم للتجديد`}
                      </Badge>
                    );
                  }
                  return null;
                })()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-300" />
                  <span className="font-medium">رقم الموبايل:</span>
                  <span className="text-blue-600 font-semibold">{customer.mobile_number}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-gray-300" />
                  <span className="font-medium">نوع الخط:</span>
                  <Badge variant="outline" className="bg-green-800 text-green-300 border-green-600">{customer.line_type} جيجا</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-300" />
                  <span className="font-medium">تاريخ الشحن:</span>
                  <span className="text-purple-600 font-semibold">{formatDate(customer.charging_date)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-gray-300" />
                  <span className="font-medium">مزود الخدمة:</span>
                  <Badge variant="outline" className="bg-blue-800 text-blue-300 border-blue-600 capitalize">{customer.provider || 'غير محدد'}</Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-300" />
                  <span className="font-medium">تاريخ التجديد:</span>
                  <span className="text-orange-600 font-semibold">{formatRenewalWithProvider(customer.charging_date, null, customer.provider)}</span>
                </div>
              </div>
              
              {/* رسالة معرفة الوحدات المتبقية للأورانج */}
              {customer.provider === 'orange' && (
                <div className="mt-4 p-4 bg-orange-900/30 border border-orange-600/50 rounded-lg">
                  <h4 className="text-orange-400 font-semibold mb-2 flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    معرفة الوحدات المتبقية
                  </h4>
                  <p className="text-gray-300 text-sm mb-3">
                    لمعرفة الوحدات المتبقية في باقتك، اطلب الكود التالي (التكلفة: 4 قروش)
                  </p>
                  <div className="flex items-center gap-2 bg-gray-800/50 p-3 rounded border">
                    <code className="text-orange-400 font-mono text-lg flex-1">#16*1*1#</code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText('#16*1*1#');
                        toast({
                          title: "تم النسخ",
                          description: "تم نسخ الكود بنجاح",
                        });
                      }}
                      className="text-orange-400 border-orange-600 hover:bg-orange-900/20"
                    >
                      <Copy className="h-4 w-4 ml-1" />
                      نسخ الكود
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};