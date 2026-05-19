import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bold, 
  Italic, 
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo,
  Redo,
  ChevronDown,
  Save,
  FileText,
  Printer,
  Search,
  Copy,
  Clipboard,
  Scissors,
  Palette,
  Type,
  Minus,
  Plus,
  Image,
  Table,
  FileImage,
  Settings,
  Home,
  ArrowLeft
} from "lucide-react";

interface ContractCreatePageProps {
  onBack?: () => void;
}

export default function ContractCreatePage({ onBack }: ContractCreatePageProps = {}) {
  const { toast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // API 뮤테이션 설정 (API mutation setup)
  const createContractMutation = useMutation({
    mutationFn: async (contractData: any) => {
      const res = await apiRequest("POST", "/api/contracts", contractData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "계약서 저장에 실패했습니다" }));
        throw new Error(errorData.error || "계약서 저장에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
      toast({
        title: "저장 완료",
        description: "계약서가 성공적으로 저장되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "저장 실패",
        description: error.message || "계약서 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  });

  const [fontSize, setFontSize] = useState("12");
  const [fontFamily, setFontFamily] = useState("돋움");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [textAlign, setTextAlign] = useState("left");
  const [textColor, setTextColor] = useState("#000000");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [contractTitle, setContractTitle] = useState("헬스장 회원 이용 계약서");
  const [zoom, setZoom] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [contractContent, setContractContent] = useState(`
<div style="text-align: center; margin-bottom: 30px;">
  <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">헬스장 회원 이용 계약서</h1>
</div>

<div style="margin-bottom: 20px;">
  <p><strong>계약자 정보</strong></p>
  <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
    <tr style="border: 1px solid #000;">
      <td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5; width: 120px;"><strong>성명</strong></td>
      <td style="border: 1px solid #000; padding: 8px; width: 200px;"></td>
      <td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5; width: 120px;"><strong>생년월일</strong></td>
      <td style="border: 1px solid #000; padding: 8px;"></td>
    </tr>
    <tr style="border: 1px solid #000;">
      <td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>연락처</strong></td>
      <td style="border: 1px solid #000; padding: 8px;"></td>
      <td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"><strong>주소</strong></td>
      <td style="border: 1px solid #000; padding: 8px;"></td>
    </tr>
  </table>
</div>

<div style="margin-bottom: 20px;">
  <p><strong>제1조 (계약 목적)</strong></p>
  <p style="margin-left: 20px;">본 계약은 헬스장 시설 이용에 관한 조건과 절차를 명시하여 계약자와 헬스장 간의 권리와 의무를 정하는 것을 목적으로 합니다.</p>
</div>

<div style="margin-bottom: 20px;">
  <p><strong>제2조 (이용 기간 및 요금)</strong></p>
  <p style="margin-left: 20px;">• 이용 기간: ______년 ___월 ___일 ~ ______년 ___월 ___일</p>
  <p style="margin-left: 20px;">• 이용 요금: ____________원</p>
  <p style="margin-left: 20px;">• 결제 방법: □ 현금 □ 카드 □ 계좌이체 □ 기타(_______)</p>
</div>

<div style="margin-bottom: 20px;">
  <p><strong>제3조 (이용 수칙)</strong></p>
  <p style="margin-left: 20px;">1. 회원은 헬스장 이용 시 안전 수칙을 준수해야 합니다.</p>
  <p style="margin-left: 20px;">2. 운동 중 발생하는 부상에 대해서는 회원 본인이 책임을 집니다.</p>
  <p style="margin-left: 20px;">3. 헬스장 시설 및 장비를 훼손한 경우 변상 책임이 있습니다.</p>
  <p style="margin-left: 20px;">4. 타인에게 피해를 주는 행위는 금지됩니다.</p>
</div>

<div style="margin-bottom: 20px;">
  <p><strong>제4조 (환불 및 해지)</strong></p>
  <p style="margin-left: 20px;">1. 계약 해지 시 환불은 소비자분쟁조정위원회 기준을 따릅니다.</p>
  <p style="margin-left: 20px;">2. 회원의 귀책사유로 인한 해지 시 위약금이 부과될 수 있습니다.</p>
</div>

<div style="margin-bottom: 20px;">
  <p><strong>제5조 (개인정보 처리)</strong></p>
  <p style="margin-left: 20px;">헬스장은 개인정보보호법에 따라 회원의 개인정보를 보호하며, 동의 없이 제3자에게 제공하지 않습니다.</p>
</div>

<div style="margin-top: 50px;">
  <p style="text-align: center;"><strong>본 계약서의 내용을 충분히 읽고 이해하였으며, 이에 동의합니다.</strong></p>
</div>

<div style="margin-top: 30px;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="width: 50%; text-align: center; padding: 20px;">
        <p><strong>계약자 (회원)</strong></p>
        <p style="margin-top: 30px;">성명: _________________ (인/서명)</p>
        <p>날짜: ______년 ___월 ___일</p>
      </td>
      <td style="width: 50%; text-align: center; padding: 20px;">
        <p><strong>헬스장 (사업자)</strong></p>
        <p style="margin-top: 30px;">대표자: _________________ (인/서명)</p>
        <p>날짜: ______년 ___월 ___일</p>
      </td>
    </tr>
  </table>
</div>
`);

  // 문서 편집 기능들
  const applyFormatting = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      updateToolbarState();
    }
  };

  const updateToolbarState = () => {
    setIsBold(document.queryCommandState('bold'));
    setIsItalic(document.queryCommandState('italic'));
    setIsUnderline(document.queryCommandState('underline'));
    
    const align = document.queryCommandValue('justifyLeft') ? 'left' :
                  document.queryCommandValue('justifyCenter') ? 'center' :
                  document.queryCommandValue('justifyRight') ? 'right' : 'left';
    setTextAlign(align);
  };

  const handleFontSizeChange = (value: string) => {
    setFontSize(value);
    applyFormatting('fontSize', value);
  };

  const handleFontFamilyChange = (value: string) => {
    setFontFamily(value);
    applyFormatting('fontName', value);
  };

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
    applyFormatting('foreColor', color);
  };

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    applyFormatting('backColor', color);
  };

  const handleZoomChange = (change: number) => {
    const newZoom = Math.max(25, Math.min(500, zoom + change));
    setZoom(newZoom);
  };

  const insertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; background-color: #f5f5f5;"></td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
          <td style="border: 1px solid #000; padding: 8px;"></td>
        </tr>
      </table>
    `;
    applyFormatting('insertHTML', tableHtml);
  };

  const handleSaveTemp = () => {
    const tempData = {
      title: contractTitle,
      content: DOMPurify.sanitize(editorRef.current?.innerHTML || contractContent),
      fontSize,
      fontFamily,
      textColor,
      backgroundColor,
      zoom,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('contract_temp_save', JSON.stringify(tempData));
    toast({
      title: "임시저장 완료",
      description: "작성 중인 계약서가 임시저장되었습니다.",
    });
  };

  const handleSaveFinal = async () => {
    if (!contractTitle.trim()) {
      toast({
        title: "오류",
        description: "계약서 제목을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    const content = DOMPurify.sanitize(editorRef.current?.innerHTML || contractContent);
    if (!content.trim()) {
      toast({
        title: "오류", 
        description: "계약서 내용을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // API를 통한 최종 저장 (Final save through API)
    const contractData = {
      title: contractTitle,
      content: content,
      fontSize: fontSize + "px",
      fontFamily: fontFamily,
      textColor: textColor,
      backgroundColor: backgroundColor,
      zoom: zoom,
      isActive: true,
      isTemplate: false,
      lastEditDate: new Date().toISOString()
    };

    try {
      await createContractMutation.mutateAsync(contractData);
      
      // 임시 저장 데이터 삭제 (Clear temporary save data)
      localStorage.removeItem('contract_temp_save');
      
      // 뒤로 가기 처리 (Handle back navigation)
      if (onBack) {
        onBack();
      }
    } catch (error) {
      console.error('Error saving contract:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('contract_temp_save');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setContractTitle(data.title || contractTitle);
        setContractContent(data.content || contractContent);
        setFontSize(data.fontSize || "12");
        setFontFamily(data.fontFamily || "돋움");
        setTextColor(data.textColor || "#000000");
        setBackgroundColor(data.backgroundColor || "#ffffff");
        setZoom(data.zoom || 100);
      } catch (error) {
        console.error('임시저장 데이터 로드 실패:', error);
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* 상단 메뉴바 - 한글 워드프로세서 스타일 */}
      <div className="bg-white border-b border-gray-200">
        {/* 파일 메뉴 */}
        <div className="flex items-center px-4 py-1 text-sm border-b border-gray-100">
          <Button variant="ghost" size="sm" onClick={handleBack} className="mr-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            돌아가기
          </Button>
          <Button variant="ghost" size="sm" onClick={handleSaveTemp} className="mr-2">
            <Save className="w-4 h-4 mr-1" />
            임시저장
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSaveFinal} 
            className="mr-2"
            disabled={createContractMutation.isPending}
          >
            {createContractMutation.isPending ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-1"></div>
                저장 중...
              </div>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-1" />
                저장
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePrint} className="mr-2">
            <Printer className="w-4 h-4 mr-1" />
            인쇄
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Button variant="ghost" size="sm" onClick={() => applyFormatting('undo')}>
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => applyFormatting('redo')}>
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        {/* 포맷팅 툴바 */}
        <div className="flex items-center px-4 py-2 space-x-2">
          {/* 글꼴 */}
          <Select value={fontFamily} onValueChange={handleFontFamilyChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="돋움">돋움</SelectItem>
              <SelectItem value="굴림">굴림</SelectItem>
              <SelectItem value="바탕">바탕</SelectItem>
              <SelectItem value="궁서">궁서</SelectItem>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Malgun Gothic">맑은 고딕</SelectItem>
            </SelectContent>
          </Select>

          {/* 글자 크기 */}
          <Select value={fontSize} onValueChange={handleFontSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="8">8pt</SelectItem>
              <SelectItem value="9">9pt</SelectItem>
              <SelectItem value="10">10pt</SelectItem>
              <SelectItem value="11">11pt</SelectItem>
              <SelectItem value="12">12pt</SelectItem>
              <SelectItem value="14">14pt</SelectItem>
              <SelectItem value="16">16pt</SelectItem>
              <SelectItem value="18">18pt</SelectItem>
              <SelectItem value="20">20pt</SelectItem>
              <SelectItem value="24">24pt</SelectItem>
              <SelectItem value="28">28pt</SelectItem>
              <SelectItem value="32">32pt</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* 글자 스타일 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('bold')}
            className={isBold ? "bg-gray-200" : ""}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('italic')}
            className={isItalic ? "bg-gray-200" : ""}
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('underline')}
            className={isUnderline ? "bg-gray-200" : ""}
          >
            <Underline className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* 글자 색상 */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Type className="w-4 h-4" />
            </Button>
            <input
              type="color"
              value={textColor}
              onChange={(e) => handleTextColorChange(e.target.value)}
              className="w-8 h-8 border-none cursor-pointer"
            />
          </div>

          {/* 배경 색상 */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm">
              <Palette className="w-4 h-4" />
            </Button>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="w-8 h-8 border-none cursor-pointer"
            />
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* 정렬 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('justifyLeft')}
            className={textAlign === "left" ? "bg-gray-200" : ""}
          >
            <AlignLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('justifyCenter')}
            className={textAlign === "center" ? "bg-gray-200" : ""}
          >
            <AlignCenter className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('justifyRight')}
            className={textAlign === "right" ? "bg-gray-200" : ""}
          >
            <AlignRight className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('justifyFull')}
          >
            <AlignJustify className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* 목록 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('insertUnorderedList')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => applyFormatting('insertOrderedList')}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* 표 삽입 */}
          <Button variant="ghost" size="sm" onClick={insertTable}>
            <Table className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          {/* 확대/축소 */}
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => handleZoomChange(-10)}>
              <Minus className="w-4 h-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="sm" onClick={() => handleZoomChange(10)}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 문서 제목 입력 */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <Input
          placeholder="계약서 제목을 입력하세요..."
          value={contractTitle}
          onChange={(e) => setContractTitle(e.target.value)}
          className="text-lg font-medium border-none shadow-none focus:ring-0"
        />
      </div>

      {/* 눈금자 (옵션) */}
      {showRuler && (
        <div className="bg-white border-b border-gray-200 h-6 flex items-center px-4">
          <div className="flex-1 h-4 bg-gradient-to-r from-gray-100 to-gray-200 relative">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute border-l border-gray-400 h-full"
                style={{ left: `${i * 5}%` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* 문서 편집 영역 */}
      <div className="flex-1 bg-gray-100 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* A4 용지 느낌의 편집 영역 */}
          <div 
            className="bg-white shadow-lg min-h-[297mm] p-8 mx-auto"
            style={{ 
              width: '210mm',
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              marginBottom: `${(zoom - 100) * 3}px`
            }}
          >
            <div
              ref={editorRef}
              contentEditable
              className="min-h-full outline-none"
              style={{
                fontFamily: fontFamily,
                fontSize: `${fontSize}pt`,
                color: textColor,
                backgroundColor: backgroundColor,
                lineHeight: '1.6'
              }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contractContent) }}
              onInput={updateToolbarState}
              onKeyUp={updateToolbarState}
              onMouseUp={updateToolbarState}
            />
          </div>
        </div>
      </div>

      {/* 하단 상태바 */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-4">
          <span>페이지 {currentPage}</span>
          <span>단어 수: {contractContent.replace(/<[^>]*>/g, '').split(/\s+/).length}</span>
          <span>글자 수: {contractContent.replace(/<[^>]*>/g, '').length}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>확대: {zoom}%</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRuler(!showRuler)}
          >
            눈금자 {showRuler ? '숨기기' : '보기'}
          </Button>
        </div>
      </div>
    </div>
  );
}