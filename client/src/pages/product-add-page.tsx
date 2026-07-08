import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardAccentLine } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { insertProductSchema, type InsertProduct, type Staff } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, Clock, FileText, Tag, Users } from "lucide-react";

interface ProductAddPageProps {
  onBack: () => void;
  defaultCategory?: string;
}

export default function ProductAddPage({ onBack, defaultCategory = "회원권" }: ProductAddPageProps) {
  const [productType, setProductType] = useState("회원권");
  const [usageType, setUsageType] = useState("기간제");
  const [categoryType, setCategoryType] = useState(defaultCategory);
  const [duration, setDuration] = useState("");
  const [durationType, setDurationType] = useState("0개월");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [customSettings, setCustomSettings] = useState(false);
  // 🆕 수업 상품용 추가 상태 (Additional state for class products)
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [lessonType, setLessonType] = useState<"개인" | "그룹">("개인");
  const [maxParticipants, setMaxParticipants] = useState<number>(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 📊 강사 데이터 조회 (Fetch staff/instructor data)
  const { data: staffList = [] } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const form = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: "",
      price: 0,
      duration: 1,
      durationType: "월",
      sessions: 0,
      category: defaultCategory,
      description: "",
      status: "active",
      franchiseId: 1,
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const res = await apiRequest("POST", "/api/products", data);
      return await res.json();
    },
    onSuccess: () => {
      // 🔄 강력한 캐시 무효화 (Aggressive cache invalidation)
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.removeQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
      
      // 🔄 모든 products 관련 캐시 제거 (Remove all products related cache)
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey.some(key => typeof key === 'string' && key.includes('products'))
      });
      
      toast({
        title: "상품 추가 완료",
        description: "상품이 성공적으로 추가되었습니다.",
      });
      
      // 폼 초기화
      form.reset();
      setPrice("");
      setDuration("");
      setCategoryType(defaultCategory);
      setDescription("");
      
      // 상품 목록 페이지로 이동
      onBack();
    },
    onError: (error: Error) => {
      toast({
        title: "추가 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = useCallback(() => {
    // 입력값 검증
    if (!form.watch("name") || !form.watch("name").trim()) {
      toast({
        title: "상품명 필수",
        description: "상품명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const parsedPrice = parseInt(price);
    const parsedDuration = parseInt(duration);

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast({
        title: "가격 오류",
        description: "올바른 가격을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(parsedDuration) || parsedDuration < 1) {
      toast({
        title: "기간 오류",
        description: "올바른 기간을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 🆕 수업 상품 유효성 검사 (Lesson product validation)
    if (productType === "개인 레슨") {
      if (lessonType === "그룹" && (!maxParticipants || maxParticipants < 2)) {
        toast({
          title: "인원수 오류",
          description: "그룹 수업은 최소 2명 이상의 인원이 필요합니다.",
          variant: "destructive",
        });
        return;
      }
    }

    const data: InsertProduct = {
      name: form.watch("name").trim(),
      price: parsedPrice,
      duration: parsedDuration,
      durationType: "월",
      sessions: 0,
      category: categoryType,
      description: description.trim(),
      status: "active",
      franchiseId: 1,
      // 🆕 수업 상품 필드 (Lesson product fields)
      instructorId: productType === "개인 레슨" && selectedInstructorId ? selectedInstructorId : undefined,
      lessonType: productType === "개인 레슨" ? lessonType : undefined,
      maxParticipants: productType === "개인 레슨" && lessonType === "그룹" ? maxParticipants : undefined,
    };
    
    createProductMutation.mutate(data);
  }, [form, price, duration, categoryType, description, createProductMutation, toast, productType, selectedInstructorId, lessonType, maxParticipants]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2 hover-elevate"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-3 gap-6">
          
          {/* Column 1: 상품 정보 */}
          <Card className="p-6 bg-white shadow-sm border-0 shadow-lg">
            <CardAccentLine />
            <div className="flex items-center gap-2 mb-6">
              <Tag className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">상품 정보</h2>
            </div>

            <div className="space-y-8">
              {/* 상품 유형 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm font-semibold text-gray-700 mb-4 block">상품 유형 *</Label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover-elevate transition-colors">
                      <input
                        type="radio"
                        name="productType"
                        value="회원권"
                        checked={productType === "회원권"}
                        onChange={() => setProductType("회원권")}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">회원권</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover-elevate transition-colors">
                      <input
                        type="radio"
                        name="productType"
                        value="개인 레슨"
                        checked={productType === "개인 레슨"}
                        onChange={() => setProductType("개인 레슨")}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">개인 레슨</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover-elevate transition-colors">
                      <input
                        type="radio"
                        name="productType"
                        value="락커 상품"
                        checked={productType === "락커 상품"}
                        onChange={() => setProductType("락커 상품")}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">락커 상품</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover-elevate transition-colors">
                      <input
                        type="radio"
                        name="productType"
                        value="운동 용품"
                        checked={productType === "운동 용품"}
                        onChange={() => setProductType("운동 용품")}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <span className="text-sm font-medium text-gray-700">운동 용품</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 🆕 수업 상품 추가 설정 (Lesson product additional settings) */}
              {productType === "개인 레슨" && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-4 h-4 text-orange-500" />
                    <Label className="text-sm font-semibold text-orange-700">수업 설정</Label>
                  </div>
                  
                  <div className="space-y-4">
                    {/* 강사 선택 */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block text-gray-600">담당 강사</Label>
                      <Select 
                        value={selectedInstructorId?.toString() || ""} 
                        onValueChange={(val) => setSelectedInstructorId(val ? parseInt(val) : null)}
                      >
                        <SelectTrigger className="bg-white border-gray-200" data-testid="select-instructor">
                          <SelectValue placeholder="강사를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                          {staffList.filter((s) => s.id != null && s.status !== '퇴사').map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name} ({s.position || '강사'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 레슨 타입 (개인/그룹) */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block text-gray-600">레슨 타입 *</Label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="lessonType"
                            value="개인"
                            checked={lessonType === "개인"}
                            onChange={() => setLessonType("개인")}
                            className="w-4 h-4 text-orange-500"
                            data-testid="radio-lesson-type-private"
                          />
                          <span className="text-sm">개인 레슨</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="lessonType"
                            value="그룹"
                            checked={lessonType === "그룹"}
                            onChange={() => setLessonType("그룹")}
                            className="w-4 h-4 text-orange-500"
                            data-testid="radio-lesson-type-group"
                          />
                          <span className="text-sm">그룹 수업</span>
                        </label>
                      </div>
                    </div>

                    {/* 그룹 수업일 때 인원수 입력 */}
                    {lessonType === "그룹" && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block text-gray-600">최대 참가 인원 *</Label>
                        <Input
                          type="number"
                          min="2"
                          max="50"
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(parseInt(e.target.value) || 10)}
                          className="bg-white border-gray-200 w-32"
                          data-testid="input-max-participants"
                        />
                        <p className="text-xs text-gray-500 mt-1">그룹 수업 최대 인원을 설정하세요</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 이용권 분류 */}
              <div>
                <Label className="text-sm font-medium mb-4 block">이용권 분류</Label>
                
                <div className="space-y-6">
                  {/* 이용권 유형 */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">이용권 유형 *</Label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="usageType"
                          value="기간제"
                          checked={usageType === "기간제"}
                          onChange={() => setUsageType("기간제")}
                          className="w-4 h-4 text-orange-500"
                        />
                        <span className="text-sm">기간제</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="usageType"
                          value="수건"
                          checked={usageType === "수건"}
                          onChange={() => setUsageType("수건")}
                          className="w-4 h-4 text-orange-500"
                        />
                        <span className="text-sm">수건</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="usageType"
                          value="기타"
                          checked={usageType === "기타"}
                          onChange={() => setUsageType("기타")}
                          className="w-4 h-4 text-orange-500"
                        />
                        <span className="text-sm">기타</span>
                      </label>
                    </div>
                  </div>

                  {/* 이용권 카테고리 */}
                  <div>
                    <Label className="text-sm font-medium mb-3 block">이용권 카테고리 *</Label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryType"
                            value="운동복"
                            checked={categoryType === "운동복"}
                            onChange={() => setCategoryType("운동복")}
                            className="w-4 h-4 text-orange-500"
                          />
                          <span className="text-sm">운동복</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryType"
                            value="수건"
                            checked={categoryType === "수건"}
                            onChange={() => setCategoryType("수건")}
                            className="w-4 h-4 text-orange-500"
                          />
                          <span className="text-sm">수건</span>
                        </label>
                      </div>
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="categoryType"
                            value="기타"
                            checked={categoryType === "기타"}
                            onChange={() => setCategoryType("기타")}
                            className="w-4 h-4 text-orange-500"
                          />
                          <span className="text-sm">기타</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm font-semibold text-gray-700 mb-4 block">기본 정보</Label>
                <div>
                  <Label className="text-sm font-medium mb-2 block text-gray-600">상품명 *</Label>
                  <Input
                    {...form.register("name")}
                    placeholder="추가할 상품명을 입력해 주세요"
                    className="bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Column 2: 기간 및 횟수 설정 + 정시/근무 설정 */}
          <div className="space-y-6">
            {/* 기간 및 횟수 설정 */}
            <Card className="p-6 bg-white shadow-sm border-0 shadow-lg">
              <CardAccentLine />
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">기간 및 횟수 설정</h2>
              </div>

              <div className="space-y-6">
                {/* 상품 기간 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-semibold text-gray-700 mb-4 block">상품 기간</Label>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block text-gray-600">기간 *</Label>
                      <div className="flex items-center gap-2">
                        <Select value={durationType} onValueChange={setDurationType}>
                          <SelectTrigger className="w-32 bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0개월">0개월</SelectItem>
                            <SelectItem value="1개월">1개월</SelectItem>
                            <SelectItem value="3개월">3개월</SelectItem>
                            <SelectItem value="6개월">6개월</SelectItem>
                            <SelectItem value="12개월">12개월</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block text-gray-600">서비스 기간 *</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="0"
                          className="bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                        />
                        <span className="text-sm text-gray-600 font-medium">월</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 금액 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <Label className="text-sm font-semibold text-gray-700 mb-4 block">금액</Label>
                  <div>
                    <Label className="text-sm font-medium mb-2 block text-gray-600">금액 *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0"
                        className="bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400"
                      />
                      <span className="text-sm text-gray-600 font-medium">원</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* 정시/근무 설정 - 분리된 카드 */}
            <Card className="p-6 bg-white shadow-sm border-0 shadow-lg">
              <CardAccentLine />
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">정시/근무 설정</h2>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">정시 설정</Label>
                    <p className="text-xs text-gray-500 mt-1">정시 운영 시간을 설정합니다</p>
                  </div>
                  <Switch
                    checked={customSettings}
                    onCheckedChange={setCustomSettings}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Column 3: 상품 설명 */}
          <Card className="p-6 bg-white shadow-sm border-0 shadow-lg">
            <CardAccentLine />
            <div className="flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">상품 설명</h2>
            </div>

            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-sm text-orange-800 space-y-2">
                  <p className="font-medium">상품 설명 작성 가이드</p>
                  <p>• 상품의 특징과 이용 방법을 상세히 설명해주세요</p>
                  <p>• 유의사항이나 제한사항이 있다면 명시해주세요</p>
                  <p className="text-xs text-orange-600 mt-2">최대 1,000자까지 입력 가능합니다.</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">상품 설명 *</Label>
                <div className="relative">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="추가할 상품의 이용방법과 상세 정보를 입력해 주세요"
                    className="min-h-[200px] bg-white border-gray-200 focus:border-orange-400 focus:ring-orange-400 resize-none text-gray-900 placeholder-gray-400"
                    maxLength={1000}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                    {description.length}/1,000
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Buttons */}
        <div className="flex gap-4 justify-center mt-8 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="px-8 py-3 border-2 border-gray-300 text-gray-700 hover-elevate hover:border-gray-400 font-medium transition-colors"
          >
            돌아가기
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={createProductMutation.isPending}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover-elevate text-white font-medium shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            {createProductMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                추가 중...
              </div>
            ) : (
              "상품 추가"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}