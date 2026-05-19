import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, FileText, User, Clock, Calendar, Banknote, Users, AlignLeft } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ProductFormData {
  name: string;
  price: number;
  duration: number;
  durationType: string;
  sessions: number;
  description: string;
  instructorId: string;
  startTime: string;
  endTime: string;
  selectedDays: string[];
  maxParticipants: string;
  minParticipants: string;
}

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: "회원권" | "PT" | "그룹수업" | "락커 상품" | "운동 용품" | "기타";
  onProductCreated?: (productId: number) => void;
}

export function CreateProductDialog({ 
  open, 
  onOpenChange, 
  category,
  onProductCreated 
}: CreateProductDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 강사 목록 조회 (수업 상품일 때만)
  const { data: staff = [] } = useQuery({
    queryKey: ["/api/staff"],
    enabled: category === "PT" || category === "그룹수업",
  });
  
  const getCategoryLabel = () => {
    switch (category) {
      case "회원권": return "회원권";
      case "PT": return "개인 레슨(PT)";
      case "그룹수업": return "그룹 수업";
      case "락커 상품": return "락커 상품";
      case "운동 용품": return "운동 용품";
      default: return "상품";
    }
  };

  // 수업 상품 여부 확인
  const isLessonProduct = category === "PT" || category === "그룹수업";

  const form = useForm<ProductFormData>({
    defaultValues: {
      name: "",
      price: 0,
      duration: 1,
      durationType: "월",
      sessions: category === "PT" ? 10 : 0,
      description: "",
      instructorId: "",
      startTime: "09:00",
      endTime: "10:00",
      selectedDays: [],
      maxParticipants: "10",
      minParticipants: "1",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const lessonType = category === "PT" ? "개인 레슨" : category === "그룹수업" ? "그룹 수업" : undefined;
      const response = await apiRequest("POST", "/api/products", {
        name: data.name,
        price: data.price,
        duration: data.duration || 1,
        durationType: data.durationType || "월",
        sessions: data.sessions ?? 0,
        category: isLessonProduct ? "수업 상품" : category,
        description: data.description || "",
        status: "활성",
        appExposed: true,
        lessonType: lessonType,
        instructorId: data.instructorId && data.instructorId !== "none" ? parseInt(data.instructorId) : undefined,
        startTime: isLessonProduct ? data.startTime : undefined,
        endTime: isLessonProduct ? data.endTime : undefined,
        operatingDays: isLessonProduct && data.selectedDays.length > 0 ? data.selectedDays : undefined,
        maxParticipants: isLessonProduct ? parseInt(data.maxParticipants) || 10 : undefined,
        minParticipants: isLessonProduct ? parseInt(data.minParticipants) || 1 : undefined,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "상품 등록에 실패했습니다");
      }
      return response.json();
    },
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "상품 등록 완료",
        description: `${getCategoryLabel()} 상품이 성공적으로 등록되었습니다.`,
      });
      onOpenChange(false);
      form.reset();
      if (onProductCreated && newProduct?.id) {
        onProductCreated(newProduct.id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "등록 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    // 수업 상품 유효성 검사
    if (isLessonProduct) {
      if (!data.startTime || !data.endTime) {
        toast({ title: "오류", description: "수업 시간을 선택해주세요.", variant: "destructive" });
        return;
      }
    }
    createProductMutation.mutate(data);
  };

  const selectedDays = form.watch("selectedDays") || [];

  const toggleDay = (day: string) => {
    const current = form.getValues("selectedDays") || [];
    if (current.includes(day)) {
      form.setValue("selectedDays", current.filter(d => d !== day));
    } else {
      form.setValue("selectedDays", [...current, day]);
    }
  };

  // 수업 상품(PT, 그룹수업)용 폼
  if (isLessonProduct) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]" aria-describedby="create-product-dialog-description">
          <DialogHeader>
            <DialogTitle>새 {getCategoryLabel()} 상품 등록</DialogTitle>
            <DialogDescription id="create-product-dialog-description" className="sr-only">
              새로운 {getCategoryLabel()} 상품을 등록합니다.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* 수업명 */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">수업명 *</Label>
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "수업명을 입력해주세요" }}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          placeholder="수업명을 입력하세요" 
                          {...field} 
                          data-testid="input-product-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 담당 강사 */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">담당 강사</Label>
                <FormField
                  control={form.control}
                  name="instructorId"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="강사 선택" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">미지정</SelectItem>
                          {Array.isArray(staff) && staff
                            .filter((s: any) => s.status === '재직')
                            .map((s: any) => (
                              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 수업 시간 */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">수업 시간 *</Label>
                <div className="flex items-center gap-2 flex-1">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="시작" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {i.toString().padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <span className="text-gray-500">~</span>
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger className="w-24">
                          <SelectValue placeholder="종료" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => (
                            <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                              {i.toString().padStart(2, '0')}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {/* 운영 요일 */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">운영 요일</Label>
                <div className="flex gap-2 flex-1">
                  {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        selectedDays.includes(day)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover-elevate'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* 수업료 */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <Banknote className="h-4 w-4 text-blue-600" />
                </div>
                <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">수업료 (원) *</Label>
                <FormField
                  control={form.control}
                  name="price"
                  rules={{ required: "수업료를 입력해주세요", min: { value: 0, message: "0 이상 입력해주세요" } }}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100000" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-product-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 인원 설정 */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">인원 설정 *</Label>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">정원</span>
                    <FormField
                      control={form.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <Input
                          type="number"
                          {...field}
                          className="w-16"
                        />
                      )}
                    />
                    <span className="text-sm text-gray-500">명</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">최소</span>
                    <FormField
                      control={form.control}
                      name="minParticipants"
                      render={({ field }) => (
                        <Input
                          type="number"
                          {...field}
                          className="w-16"
                        />
                      )}
                    />
                    <span className="text-sm text-gray-500">명</span>
                  </div>
                </div>
              </div>

              {/* 상품 설명 */}
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <AlignLeft className="h-4 w-4 text-blue-600" />
                </div>
                <Label className="text-sm font-medium text-gray-700 w-24 flex-shrink-0">상품 설명</Label>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          placeholder="상품에 대한 간단한 설명" 
                          {...field} 
                          data-testid="input-product-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  data-testid="button-cancel-product"
                >
                  취소
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProductMutation.isPending}
                  data-testid="button-submit-product"
                >
                  {createProductMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      등록 중...
                    </>
                  ) : (
                    "상품 등록"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }

  // 기존 폼 (회원권, 락커 상품, 운동 용품 등)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="create-product-dialog-description">
        <DialogHeader>
          <DialogTitle>새 {getCategoryLabel()} 상품 등록</DialogTitle>
          <DialogDescription id="create-product-dialog-description" className="sr-only">
            새로운 {getCategoryLabel()} 상품을 등록합니다.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "상품명을 입력해주세요" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상품명 *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={`예: ${category === "회원권" ? "1개월 회원권" : category === "락커 상품" ? "프리미엄 구역" : category === "운동 용품" ? "트레이닝복" : "상품명"}`} 
                      {...field} 
                      data-testid="input-product-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              rules={{ required: "가격을 입력해주세요", min: { value: 0, message: "0 이상 입력해주세요" } }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>가격 (원) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="100000" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      data-testid="input-product-price"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이용 기간</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-product-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="durationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>기간 단위</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-duration-type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="일">일</SelectItem>
                        <SelectItem value="주">주</SelectItem>
                        <SelectItem value="월">월</SelectItem>
                        <SelectItem value="년">년</SelectItem>
                        <SelectItem value="회">회</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상품 설명</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="상품에 대한 간단한 설명" 
                      {...field} 
                      data-testid="input-product-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-product"
              >
                취소
              </Button>
              <Button 
                type="submit" 
                disabled={createProductMutation.isPending}
                data-testid="button-submit-product"
              >
                {createProductMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    등록 중...
                  </>
                ) : (
                  "상품 등록"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
