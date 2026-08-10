import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardAccentLine } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { insertProductSchema, type Product, type InsertProduct } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Banknote, FileText, Tag } from "lucide-react";

interface ProductEditPageProps {
  product: Product;
  onBack: () => void;
}

export default function ProductEditPage({ product, onBack }: ProductEditPageProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(["월", "화", "수", "목", "금", "토", "일"]);
  const [pauseEnabled, setPauseEnabled] = useState(false);
  const [weekdaysChecked, setWeekdaysChecked] = useState(true);
  const [weekendsChecked, setWeekendsChecked] = useState(true);
  const [is24Hours, setIs24Hours] = useState(false);
  const [serviceCount, setServiceCount] = useState(0);
  const [productType, setProductType] = useState(product.category || "회원권");
  const [usageType, setUsageType] = useState(product.durationType || "월");
  const [categoryType, setCategoryType] = useState(product.category || "헬스");
  const [expiryPeriod, setExpiryPeriod] = useState("1개월");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: product.name,
      price: product.price,
      duration: product.duration || 1,
      durationType: product.durationType,
      sessions: product.sessions || 10,
      category: product.category,
      description: product.description || "",
      status: product.status,
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await apiRequest("PATCH", `/api/products/${product.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "상품 수정 완료",
        description: "상품이 성공적으로 수정되었습니다.",
      });
      onBack();
    },
    onError: (error: Error) => {
      toast({
        title: "수정 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertProduct) => {
    updateProductMutation.mutate({
      ...data,
      franchiseId: 1,
    });
  };

  const days = ["월", "화", "수", "목", "금", "토", "일"];

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleWeekdaysChange = (checked: boolean) => {
    setWeekdaysChecked(checked);
    if (checked) {
      const weekdays = ["월", "화", "수", "목", "금"];
      setSelectedDays(prev => Array.from(new Set([...prev, ...weekdays])));
    } else {
      setSelectedDays(prev => prev.filter(day => !["월", "화", "수", "목", "금"].includes(day)));
    }
  };

  const handleWeekendsChange = (checked: boolean) => {
    setWeekendsChecked(checked);
    if (checked) {
      const weekends = ["토", "일"];
      setSelectedDays(prev => Array.from(new Set([...prev, ...weekends])));
    } else {
      setSelectedDays(prev => prev.filter(day => !["토", "일"].includes(day)));
    }
  };

  const handleProductTypeChange = (type: string) => {
    setProductType(type);
    form.setValue("category", type);
  };

  const handleUsageTypeChange = (type: string) => {
    setUsageType(type);
    form.setValue("durationType", type);
  };

  const handleCategoryTypeChange = (type: string) => {
    setCategoryType(type);
    form.setValue("category", type);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* 3-Column Grid Layout */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            
            {/* Column 1: 상품 정보 */}
            <Card className="p-6 bg-white shadow-sm">
              <CardAccentLine />
              <div className="flex items-center gap-2 mb-6">
                <div className="w-5 h-5 bg-gray-400 rounded flex items-center justify-center">
                  <Tag className="w-3 h-3 shrink-0 text-white" />
                </div>
                <h2 className="text-base font-medium">상품 정보</h2>
              </div>

              <div className="space-y-6">
                {/* 상품 유형 */}
                <div>
                  <Label className="text-sm font-medium mb-4 block">상품 유형 *</Label>
                  <div className="space-y-3">
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="productType"
                          value="회원권"
                          checked={productType === "회원권"}
                          onChange={() => handleProductTypeChange("회원권")}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">회원권</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="productType"
                          value="개인 레슨"
                          checked={productType === "개인 레슨"}
                          onChange={() => handleProductTypeChange("개인 레슨")}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">개인 레슨</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="productType"
                          value="락커 상품"
                          checked={productType === "락커 상품"}
                          onChange={() => handleProductTypeChange("락커 상품")}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">락커 상품</span>
                      </label>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="productType"
                          value="운동 용품"
                          checked={productType === "운동 용품"}
                          onChange={() => handleProductTypeChange("운동 용품")}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">운동 용품</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 이용권 분류 */}
                <div className="pt-4 border-t border-gray-100">
                  <Label className="text-sm font-medium mb-4 block">이용권 분류</Label>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">이용권 유형 *</Label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="usageType"
                            value="기간제"
                            checked={usageType === "월"}
                            onChange={() => handleUsageTypeChange("월")}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">기간제</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="usageType"
                            value="횟수제"
                            checked={usageType === "회"}
                            onChange={() => handleUsageTypeChange("회")}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">횟수제</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">이용권 카테고리 *</Label>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryType"
                            value="헬스"
                            checked={categoryType === "헬스"}
                            onChange={() => handleCategoryTypeChange("헬스")}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">헬스</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryType"
                            value="그룹 수업"
                            checked={categoryType === "그룹 수업"}
                            onChange={() => handleCategoryTypeChange("그룹 수업")}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">그룹 수업</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryType"
                            value="골프"
                            checked={categoryType === "골프"}
                            onChange={() => handleCategoryTypeChange("골프")}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">골프</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryType"
                            value="필라테스"
                            checked={categoryType === "필라테스"}
                            onChange={() => handleCategoryTypeChange("필라테스")}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">필라테스</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 기본 정보 */}
                <div className="pt-4 border-t border-gray-100">
                  <Label className="text-sm font-medium mb-4 block">기본 정보</Label>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">상품명 *</Label>
                      <Input
                        {...form.register("name")}
                        placeholder="테스트 3"
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">시작 *</Label>
                        <Input 
                          placeholder="오늘 12:00" 
                          className="bg-gray-50 border-gray-200" 
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">종료 *</Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            placeholder="오늘 11:59" 
                            className="bg-gray-50 border-gray-200 flex-1" 
                          />
                          <div className="flex items-center gap-1">
                            <Checkbox
                              id="24hours"
                              checked={is24Hours}
                              onCheckedChange={(checked) => setIs24Hours(checked === true)}
                            />
                            <label htmlFor="24hours" className="text-xs">24시간</label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">운영 요일 *</Label>
                      <div className="space-y-3">
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1">
                            <Checkbox 
                              id="weekdays" 
                              checked={weekdaysChecked}
                              onCheckedChange={handleWeekdaysChange}
                            />
                            <label htmlFor="weekdays" className="text-sm">평일 모두</label>
                          </div>
                          <div className="flex items-center gap-1">
                            <Checkbox 
                              id="weekends"
                              checked={weekendsChecked}
                              onCheckedChange={handleWeekendsChange}
                            />
                            <label htmlFor="weekends" className="text-sm">주말 모두</label>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {days.map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`w-10 h-10 rounded-full text-sm font-medium ${
                                selectedDays.includes(day) 
                                  ? "bg-orange-500 text-white" 
                                  : "bg-orange-100 text-orange-500"
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Column 2: 기간 및 횟수 설정 */}
            <Card className="p-6 bg-white shadow-sm">
              <CardAccentLine />
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h2 className="text-base font-medium">기간 및 횟수 설정</h2>
              </div>

              <div className="space-y-6">
                {/* 상품 횟수 */}
                <div>
                  <Label className="text-sm font-medium mb-4 block">상품 횟수</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600 mb-2 block">이용 횟수 *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          {...form.register("sessions", { valueAsNumber: true })}
                          placeholder="10"
                          className="bg-gray-50 border-gray-200"
                        />
                        <span className="text-sm text-gray-600">회</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600 mb-2 block">서비스 횟수 *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={serviceCount}
                          onChange={(e) => setServiceCount(Number(e.target.value))}
                          placeholder="0"
                          className="bg-gray-50 border-gray-200"
                        />
                        <span className="text-sm text-gray-600">회</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 상품 유효 기간 설정 */}
                <div className="pt-4 border-t border-gray-100">
                  <Label className="text-sm font-medium mb-4 block">상품 유효 기간 설정</Label>
                  <div>
                    <Label className="text-sm text-gray-600 mb-2 block">횟수제 만료 기간</Label>
                    <Select value={expiryPeriod} onValueChange={setExpiryPeriod}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="1개월" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1개월">1개월</SelectItem>
                        <SelectItem value="2개월">2개월</SelectItem>
                        <SelectItem value="3개월">3개월</SelectItem>
                        <SelectItem value="6개월">6개월</SelectItem>
                        <SelectItem value="12개월">12개월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 정지일 / 금액 설정 */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Banknote className="w-5 h-5 text-gray-600" />
                    <Label className="text-sm font-medium">정지일 / 금액 설정</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">정지 설정</Label>
                      <Switch 
                        checked={pauseEnabled}
                        onCheckedChange={setPauseEnabled}
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-4 block">금액</Label>
                      <div>
                        <Label className="text-sm text-gray-600 mb-2 block">금액 *</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            {...form.register("price", { valueAsNumber: true })}
                            placeholder="0"
                            className="bg-gray-50 border-gray-200"
                          />
                          <span className="text-sm text-gray-600">원</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Column 3: 상품 설명 */}
            <Card className="p-6 bg-white shadow-sm">
              <CardAccentLine />
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-gray-600" />
                <h2 className="text-base font-medium">상품 설명</h2>
              </div>

              <div className="space-y-4">
                <div className="text-sm text-gray-600 space-y-1">
                  <p>상품에 대한 정보를 입력해 주세요.</p>
                  <p>예) 상품의 특징, 이용 방법, 유의사항 등</p>
                  <p className="pt-2">최대 1,000자까지 입력 가능합니다.</p>
                </div>
                
                <div className="space-y-2">
                  <Textarea
                    {...form.register("description")}
                    placeholder=""
                    className="min-h-[200px] bg-gray-50 border-gray-200 resize-none"
                    maxLength={1000}
                  />
                  <div className="text-right text-xs text-gray-400">
                    {form.watch("description")?.length || 0}/1,000
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="px-8 py-3"
            >
              돌아가기
            </Button>
            <Button
              type="submit"
              disabled={updateProductMutation.isPending}
              className="px-8 py-3 bg-orange-500 hover-elevate"
            >
              상품 수정
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}