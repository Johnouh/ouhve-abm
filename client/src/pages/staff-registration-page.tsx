import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { User, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StaffFormData {
  name: string;
  phone: string;
  email?: string;
  position?: string;
  department?: string;
  hireDate: string;
  address?: string;
  workType?: string;
  status?: string;
  notes?: string;
}

interface StaffRegistrationPageProps {
  onBack: () => void;
}

export default function StaffRegistrationPage({ onBack }: StaffRegistrationPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StaffFormData>({
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      position: "",
      department: "",
      hireDate: new Date().toISOString().split('T')[0],
      address: "",
      workType: "정규직",
      status: "재직",
      notes: "",
    },
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      const response = await apiRequest("POST", "/api/staff", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      toast({
        title: "직원 등록 완료",
        description: "새로운 직원이 성공적으로 등록되었습니다.",
      });
      onBack();
    },
    onError: (error: Error) => {
      console.error("Staff registration error:", error);
      toast({
        title: "등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StaffFormData) => {
    createStaffMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              돌아가기
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">직원 등록</h2>
              <p className="text-gray-600 mt-1">새로운 직원 정보를 등록합니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-0 shadow-lg">
          <CardAccentLine />
          <CardContent className="p-8">
            {/* Profile Section */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <Button variant="outline" size="sm">
                  사진 등록
                </Button>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* 기본 정보 (Basic Information) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">기본 정보</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>이름 *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="직원 이름을 입력하세요" 
                              {...field} 
                              data-testid="input-staff-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>연락처 *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="010-0000-0000" 
                              {...field} 
                              data-testid="input-staff-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="hireDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>입사일 *</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value || ""} 
                              data-testid="input-staff-hiredate"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="workType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>근무형태</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "정규직"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-staff-worktype">
                                <SelectValue placeholder="근무형태 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="정규직">정규직</SelectItem>
                              <SelectItem value="계약직">계약직</SelectItem>
                              <SelectItem value="파트타임">파트타임</SelectItem>
                              <SelectItem value="인턴">인턴</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>상태 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "재직"}>
                            <FormControl>
                              <SelectTrigger data-testid="select-staff-status">
                                <SelectValue placeholder="직원 상태" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="재직">재직</SelectItem>
                              <SelectItem value="휴직">휴직</SelectItem>
                              <SelectItem value="퇴사">퇴사</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>주소</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="주소를 입력하세요" 
                            {...field} 
                            value={field.value || ""} 
                            data-testid="input-staff-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="이메일 주소" 
                            {...field} 
                            value={field.value || ""} 
                            data-testid="input-staff-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 직무 정보 (Job Information) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">직무 정보</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>직급</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-staff-position">
                                <SelectValue placeholder="직급 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="대표">대표</SelectItem>
                              <SelectItem value="매니저">매니저</SelectItem>
                              <SelectItem value="트레이너">트레이너</SelectItem>
                              <SelectItem value="강사">강사</SelectItem>
                              <SelectItem value="직원">직원</SelectItem>
                              <SelectItem value="인턴">인턴</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>부서</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                            <FormControl>
                              <SelectTrigger data-testid="select-staff-department">
                                <SelectValue placeholder="부서 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="운영팀">운영팀</SelectItem>
                              <SelectItem value="PT팀">PT팀</SelectItem>
                              <SelectItem value="GX팀">GX팀</SelectItem>
                              <SelectItem value="관리팀">관리팀</SelectItem>
                              <SelectItem value="마케팅팀">마케팅팀</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 추가 정보 (Additional Information) */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">추가 정보</h3>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>메모</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="특이사항이나 메모를 입력하세요" 
                            rows={4}
                            {...field} 
                            value={field.value || ""} 
                            data-testid="textarea-staff-notes"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onBack}
                    className="px-8"
                    data-testid="button-staff-cancel"
                  >
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary text-primary-foreground hover-elevate active-elevate-2 px-8"
                    disabled={createStaffMutation.isPending}
                    data-testid="button-staff-submit"
                  >
                    {createStaffMutation.isPending ? "등록 중..." : "등록 완료"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
