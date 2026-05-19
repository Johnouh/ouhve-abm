import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type Member, type Product, type Attendance, type Staff, type PtSession, type PersonalTraining, type Payment } from "@shared/schema";
import { ChevronLeft, ChevronRight, Calendar, User, Users, TrendingUp, Download } from "lucide-react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function StatisticsPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 데이터 조회 (Data fetching)
  const { data: membersList = [], isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: productsList = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: attendanceList = [] } = useQuery<Attendance[]>({
    queryKey: ["/api/attendance"],
  });

  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const { data: ptSessionsList = [] } = useQuery<PtSession[]>({
    queryKey: ["/api/pt-sessions"],
  });

  const { data: personalTrainingList = [] } = useQuery<PersonalTraining[]>({
    queryKey: ["/api/personal-training"],
  });

  const { data: paymentsList = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  const isLoading = membersLoading || paymentsLoading;

  const formatMonth = (date: Date) => {
    return `${date.getFullYear()}년 ${String(date.getMonth() + 1).padStart(2, '0')}월`;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const calculateCurrentMonthStats = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentMonthPayments = paymentsList.filter(payment => {
      const paymentDate = new Date(payment.paymentDate);
      return paymentDate.getMonth() === currentMonth &&
             paymentDate.getFullYear() === currentYear &&
             payment.status === '완료';
    });

    const currentMonthMembers = membersList.filter(member => {
      const joinDate = new Date(member.joinDate);
      return joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear;
    });

    const currentMonthRevenue = currentMonthPayments.reduce((total, payment) => {
      return total + (payment.amount || 0);
    }, 0);

    const getPaymentCategory = (p: Payment): string => {
      if (p.productId) {
        const product = productsList.find(prod => prod.id === p.productId);
        if (product?.category) return product.category;
      }
      const desc = p.description || '';
      if (desc.includes('락커')) return '락커';
      if (desc.includes('레슨') || desc.includes('PT') || desc.includes('개인')) return '개인PT';
      if (desc.includes('회원권') || desc.includes('회원')) return '회원권';
      return '기타';
    };

    const membershipPayments = currentMonthPayments.filter(p => getPaymentCategory(p) === '회원권');
    const ptPayments = currentMonthPayments.filter(p => getPaymentCategory(p) === '개인PT');
    const lockerPayments = currentMonthPayments.filter(p => getPaymentCategory(p) === '락커');
    const otherPayments = currentMonthPayments.filter(p => {
      const cat = getPaymentCategory(p);
      return cat !== '회원권' && cat !== '개인PT' && cat !== '락커';
    });

    const productStats = productsList.map(product => {
      const productPayments = currentMonthPayments.filter(p => p.productId === product.id);
      const revenue = productPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      return {
        name: product.name,
        category: product.category || '기타',
        memberCount: productPayments.length,
        revenue: revenue,
        transactions: productPayments.length
      };
    });

    const categoryStats = {
      '회원권': [{
        name: '회원권', category: '회원권',
        memberCount: membershipPayments.length,
        revenue: membershipPayments.reduce((sum, p) => sum + p.amount, 0),
        transactions: membershipPayments.length
      }],
      '개인PT': [{
        name: '개인 레슨', category: '개인PT',
        memberCount: ptPayments.length,
        revenue: ptPayments.reduce((sum, p) => sum + p.amount, 0),
        transactions: ptPayments.length
      }],
      '락커': [{
        name: '락커', category: '락커',
        memberCount: lockerPayments.length,
        revenue: lockerPayments.reduce((sum, p) => sum + p.amount, 0),
        transactions: lockerPayments.length
      }],
      '의류': [{ name: '의류', category: '의류', memberCount: 0, revenue: 0, transactions: 0 }],
      '기타': [{
        name: '기타', category: '기타',
        memberCount: otherPayments.length,
        revenue: otherPayments.reduce((sum, p) => sum + p.amount, 0),
        transactions: otherPayments.length
      }]
    };

    const staffStats = staffList.map(staff => {
      const staffPtRegistrations = personalTrainingList.filter(pt => pt.instructorId === staff.id);
      const monthlyPtSessions = ptSessionsList.filter(session => {
        const sessionDate = new Date(session.scheduledDate);
        return sessionDate.getMonth() === currentMonth &&
               sessionDate.getFullYear() === currentYear &&
               session.instructorId === staff.id;
      });
      const personalRevenue = monthlyPtSessions.reduce((sum, session) => {
        const ptReg = personalTrainingList.find(pt => pt.id === session.ptId);
        if (ptReg && ptReg.productId) {
          const product = productsList.find(p => p.id === ptReg.productId);
          if (product && ptReg.totalSessions > 0) {
            return sum + Math.round(product.price / ptReg.totalSessions);
          }
        }
        return sum;
      }, 0);
      const assignedMemberIds = staffPtRegistrations.map(pt => pt.memberId);
      const assignedMembers = currentMonthMembers.filter(m => assignedMemberIds.includes(m.id));
      const membershipRevenue = assignedMembers.reduce((sum, member) => {
        const product = productsList.find(p => p.id === member.productId);
        if (product?.category === '회원권') return sum + (product?.price || 0);
        return sum;
      }, 0);
      const totalRevenue = membershipRevenue + personalRevenue;
      return {
        name: staff.name,
        totalRevenue: Math.round(totalRevenue),
        membershipRevenue: Math.round(membershipRevenue),
        personalRevenue: Math.round(personalRevenue),
        groupRevenue: 0,
        etcRevenue: 0,
        ptSessionCount: monthlyPtSessions.length,
        assignedMemberCount: staffPtRegistrations.length
      };
    });

    return { currentMonthRevenue, productStats, categoryStats, staffStats, currentMonthMembers: currentMonthMembers.length, totalRevenue: currentMonthRevenue };
  };

  const stats = calculateCurrentMonthStats();

  const handleExcelDownload = () => {
    const workbook = XLSX.utils.book_new();
    const revenueData = [
      ['구분', '한달간', '누적', '총 결제', '승인', '반기', '잔여'],
      ...Object.entries(stats.categoryStats).map(([category, products]) => {
        const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
        const totalTransactions = products.reduce((sum, p) => sum + p.transactions, 0);
        return [category, `${totalRevenue.toLocaleString()} 원`, `${totalTransactions} 건`, `${totalRevenue.toLocaleString()} 원`, '0 원', '0 원', `${totalRevenue.toLocaleString()} 원`];
      })
    ];
    const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(workbook, revenueSheet, '매출통계');
    const staffData = [
      ['직원 선택', '기타 매출', '총 매출', '회원권', '개인', '그룹', '그룹 매출'],
      ...stats.staffStats.map(staff => [
        staff.name,
        `${staff.etcRevenue.toLocaleString()} 원`,
        `${staff.totalRevenue.toLocaleString()} 원`,
        `${staff.membershipRevenue.toLocaleString()} 원`,
        `${staff.personalRevenue.toLocaleString()} 원`,
        `${staff.groupRevenue.toLocaleString()} 원`,
        `${staff.groupRevenue.toLocaleString()} 원`
      ])
    ];
    const staffSheet = XLSX.utils.aoa_to_sheet(staffData);
    XLSX.utils.book_append_sheet(workbook, staffSheet, '직원별매출');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, `통계_${formatMonth(currentDate)}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="p-3 md:p-6 bg-gray-50 min-h-full space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
          <div className="md:col-span-6 space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 bg-gray-50 min-h-full">
      {/* 헤더 날짜 네비게이션 */}
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-base font-medium text-gray-900">{formatMonth(currentDate)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={goToNextMonth} className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700">
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="text-gray-600 border-gray-300 px-4 py-1 h-8">
            이번 달
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Left Column */}
        <div className="md:col-span-6 space-y-4 md:space-y-6">
          <Card className="bg-white">
            <CardAccentLine />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <h3 className="font-medium text-sm">매출 통계</h3>
                </div>
              </div>
              <div className="text-xl md:text-2xl font-bold mb-2 tabular-nums">{stats.currentMonthRevenue.toLocaleString()} 원</div>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>전월 대비</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span className="tabular-nums">전년 {stats.currentMonthRevenue.toLocaleString()}원</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm">
            <CardAccentLine />
            <CardContent className="p-4">
              <h3 className="font-medium text-sm text-gray-700 mb-3">회원권 상세 통계</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200">카테고리</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200">결제 금액</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200">판매 수</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200 hidden md:table-cell">평균 개월</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200 hidden md:table-cell">평균 횟수</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200 hidden md:table-cell">남성 매출</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium hidden md:table-cell">여성 매출</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.categoryStats).map(([category, products], index) => {
                      const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
                      const totalTransactions = products.reduce((sum, p) => sum + p.transactions, 0);
                      return (
                        <tr key={category} className={index < Object.entries(stats.categoryStats).length - 1 ? 'border-b border-gray-200' : ''}>
                          <td className="py-2 px-2 md:py-3 md:px-4 text-gray-700 border-r border-gray-200">{category}</td>
                          <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums">{totalRevenue.toLocaleString()} 원</td>
                          <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums">{totalTransactions} 건</td>
                          <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums hidden md:table-cell">0 개월</td>
                          <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums hidden md:table-cell">0 회</td>
                          <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums hidden md:table-cell">0 원</td>
                          <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 tabular-nums hidden md:table-cell">{totalRevenue.toLocaleString()} 원</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {[{ label: "개인 레슨 매출" }, { label: "락커 매출" }, { label: "운동 용품 매출" }].map(({ label }) => (
            <Card key={label} className="bg-white border-0 shadow-sm">
              <CardAccentLine />
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-gray-600 mb-1">{label}</h3>
                    <div className="text-xl font-bold text-gray-900 mb-3">0 원</div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-blue-500">
                        <span className="text-lg font-bold text-blue-600">남</span><span>남성 0원</span>
                      </div>
                      <div className="border-l border-gray-200 h-4"></div>
                      <div className="flex items-center gap-2 text-pink-500">
                        <span className="text-lg font-bold text-pink-600">여</span><span>여성 0원</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right Column */}
        <div className="md:col-span-6">
          <Card className="bg-white border-0 shadow-sm">
            <CardAccentLine />
            <CardContent className="p-4">
              <h3 className="font-medium text-sm text-gray-700 mb-3">직원별 통계 / 회원권 매출</h3>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200">직원명</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200">총 매출</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200 hidden md:table-cell">회원권</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200 hidden md:table-cell">개인 PT</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200 hidden md:table-cell">그룹 수업</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium border-r border-gray-200 hidden md:table-cell">기타 매출</th>
                      <th className="text-center py-2 px-2 md:py-3 md:px-4 text-gray-600 font-medium">판매 건수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.staffStats.map((staff, index) => (
                      <tr key={index} className={index < stats.staffStats.length - 1 ? 'border-b border-gray-200' : ''}>
                        <td className="py-2 px-2 md:py-3 md:px-4 text-gray-700 border-r border-gray-200">{staff.name}</td>
                        <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums">{staff.totalRevenue.toLocaleString()} 원</td>
                        <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums hidden md:table-cell">{Math.floor(staff.membershipRevenue).toLocaleString()} 원</td>
                        <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums hidden md:table-cell">{Math.floor(staff.personalRevenue).toLocaleString()} 원</td>
                        <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums hidden md:table-cell">{Math.floor(staff.groupRevenue).toLocaleString()} 원</td>
                        <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 border-r border-gray-200 tabular-nums hidden md:table-cell">{staff.etcRevenue.toLocaleString()} 원</td>
                        <td className="py-2 px-2 md:py-3 md:px-4 text-center text-gray-600 tabular-nums">0 건</td>
                      </tr>
                    ))}
                    {stats.staffStats.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-gray-500">등록된 직원이 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button onClick={handleExcelDownload} className="bg-blue-500 hover-elevate text-white">
          <Download className="w-4 h-4 mr-2" />
          엑셀 다운로드
        </Button>
      </div>
    </div>
  );
}
