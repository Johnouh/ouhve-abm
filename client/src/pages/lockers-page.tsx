// 🔐 사물함 관리 페이지 (Locker Management Page)
// 🎯 Purpose: 체육관 사물함 배정, 회수, 관리를 위한 통합 페이지 (Integrated page for gym locker assignment, recovery, and management)
// 🔒 Security: 프랜차이즈별 사물함 데이터 격리 (Franchise-based locker data isolation)
// 📊 Features: 사물함 현황 조회, 회원 배정, 요금 관리 (Locker status viewing, member assignment, fee management)

import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardAccentLine } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLockerSchema, type Locker, type InsertLocker, type Member } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/input-sanitizer";
import { 
  Search, 
  X,
  FileText,
  Upload,
  Image,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Lock
} from "lucide-react";

// 🏷️ 사물함 페이지 프롭스 타입 정의 (Locker page props type definition)
interface LockersPageProps {
  selectedLockerId?: number; // 선택된 사물함 ID (Selected locker ID)
  onLockerSelect?: (lockerId: number | undefined) => void; // 사물함 선택 콜백 (Locker selection callback)
}

// 🏷️ 구역 상세 정보 타입 (Section Details Type)
interface SectionDetail {
  name: string;
  createdBy: string;
  createdAt: string;
  lockerCount?: number;
  startNumber?: number;
  rowCount?: number;
  columnCount?: number;
  monthlyFee?: number; // 구역별 월 이용료 (Zone-specific monthly fee)
}

// 🔧 락커 설정 탭 컴포넌트 (Locker Settings Tab Component)
function LockerSettingsTab() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lockerCount, setLockerCount] = useState(25);
  const [startNumber, setStartNumber] = useState(1);
  const [currentManagement, setCurrentManagement] = useState("현관문");
  const [sections, setSections] = useState<string[]>([]); // 구역 목록 (Zone list) - 기존 호환성
  const [sectionDetails, setSectionDetails] = useState<SectionDetail[]>([]); // 구역 상세정보 (Section details)
  const [selectedSection, setSelectedSection] = useState<string | null>(null); // 선택된 구역 (Selected zone)
  const [newSectionName, setNewSectionName] = useState(""); // 새 구역명 (New zone name)
  const [editingSectionIndex, setEditingSectionIndex] = useState<number | null>(null); // 수정 중인 구역 (Editing zone)
  const [editingSectionName, setEditingSectionName] = useState(""); // 수정할 구역명 (Zone name to edit)
  const [displayName, setDisplayName] = useState("");
  const [accessLevel, setAccessLevel] = useState("all");
  const [securityLevel, setSecurityLevel] = useState("basic");
  const [rowCount, setRowCount] = useState(Math.ceil(25 / 10));
  const [columnCount, setColumnCount] = useState(10);
  const [numberingType, setNumberingType] = useState("sequential");
  const [isInitialized, setIsInitialized] = useState(false);
  const [showEditLockerDialog, setShowEditLockerDialog] = useState(false);
  const [editingLocker, setEditingLocker] = useState<any>(null);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [previewPage, setPreviewPage] = useState(1); // 미리보기 페이지 (Preview page)
  const PREVIEW_PAGE_SIZE = 25; // 미리보기 페이지 크기 (Preview page size)
  const { toast } = useToast();

  // 📊 기존 락커 설정 조회 (Fetch existing locker settings)
  const { data: existingSettings, isLoading: isLoadingSettings, isFetched } = useQuery<any>({
    queryKey: ["/api/locker-settings"],
  });

  // 📊 기존 락커 목록 조회 (Fetch existing lockers for display)
  const { data: existingLockers = [] } = useQuery<any[]>({
    queryKey: ["/api/lockers"],
  });

  // 📊 현재 사용자 정보 조회 (Fetch current user info)
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/user"],
  });

  // 🔄 기존 설정이 있으면 폼에 반영 (Populate form with existing settings)
  useEffect(() => {
    // 로딩 중이거나 이미 초기화된 경우 건너뜀 (Skip if loading or already initialized)
    if (isLoadingSettings || isInitialized) return;
    
    // 데이터 로드 완료 후에만 처리 (Only process after data is fetched)
    if (!isFetched) return;
    
    if (existingSettings) {
      if (existingSettings.sections?.length > 0) {
        setSections(existingSettings.sections);
      }
      // 📦 sectionDetails 로드 (Load section details)
      if (existingSettings.sectionDetails?.length > 0) {
        setSectionDetails(existingSettings.sectionDetails);
        setSelectedSection(existingSettings.sectionDetails[0].name);
      } else if (existingSettings.sections?.length > 0) {
        // 기존 sections만 있는 경우 sectionDetails로 변환 (Convert legacy sections to sectionDetails)
        const legacyDetails: SectionDetail[] = existingSettings.sections.map((name: string) => ({
          name,
          createdBy: "시스템",
          createdAt: new Date().toISOString().split('T')[0],
          lockerCount: existingSettings.totalLockers || 25,
          startNumber: 1,
          rowCount: Math.ceil((existingSettings.totalLockers || 25) / 10),
          columnCount: 10
        }));
        setSectionDetails(legacyDetails);
        setSections(existingSettings.sections);
        setSelectedSection(existingSettings.sections[0]);
      } else {
        // 설정은 있지만 구역이 없는 경우 기본 구역 생성 (Create default section if settings exist but no sections)
        const defaultSection: SectionDetail = {
          name: "기본",
          createdBy: "시스템",
          createdAt: new Date().toISOString().split('T')[0],
          lockerCount: 25,
          startNumber: 1,
          rowCount: 3,
          columnCount: 10
        };
        setSectionDetails([defaultSection]);
        setSections(["기본"]);
        setSelectedSection("기본");
      }
      if (existingSettings.totalLockers) {
        setLockerCount(existingSettings.totalLockers);
        setRowCount(Math.ceil(existingSettings.totalLockers / 10));
      }
      if (existingSettings.layoutImage) {
        setUploadedImage(existingSettings.layoutImage);
      }
    } else {
      // 설정이 전혀 없는 경우 기본 구역 생성 (Create default section when no settings at all)
      const defaultSection: SectionDetail = {
        name: "기본",
        createdBy: "시스템",
        createdAt: new Date().toISOString().split('T')[0],
        lockerCount: 25,
        startNumber: 1,
        rowCount: 3,
        columnCount: 10
      };
      setSectionDetails([defaultSection]);
      setSections(["기본"]);
      setSelectedSection("기본");
    }
    setIsInitialized(true);
  }, [existingSettings, isInitialized, isLoadingSettings, isFetched]);

  // 구역 추가 (Add section with details)
  const handleAddSectionWithDetails = () => {
    if (!newSectionName.trim()) {
      toast({ title: "구역명을 입력하세요", variant: "destructive" });
      return;
    }
    if (sectionDetails.some(s => s.name === newSectionName.trim())) {
      toast({ title: "이미 존재하는 구역입니다", variant: "destructive" });
      return;
    }
    const newSection: SectionDetail = {
      name: newSectionName.trim(),
      createdBy: currentUser?.name || currentUser?.username || "관리자",
      createdAt: new Date().toISOString().split('T')[0],
      lockerCount: lockerCount,
      startNumber: startNumber,
      rowCount: rowCount,
      columnCount: columnCount
    };
    const updatedDetails = [...sectionDetails, newSection];
    setSectionDetails(updatedDetails);
    setSections(updatedDetails.map(s => s.name)); // 기존 호환성
    setNewSectionName("");
    setShowAddSectionDialog(false);
    toast({ title: "구역 추가됨", description: `${newSectionName} 구역이 추가되었습니다.` });
  };

  // 구역 삭제 (Delete section)
  const handleDeleteSection = (index: number) => {
    if (sectionDetails.length <= 1) {
      toast({ title: "최소 1개의 구역이 필요합니다", variant: "destructive" });
      return;
    }
    const deletedSection = sectionDetails[index];
    const updatedDetails = sectionDetails.filter((_, i) => i !== index);
    setSectionDetails(updatedDetails);
    setSections(updatedDetails.map(s => s.name)); // 기존 호환성
    if (selectedSection === deletedSection.name) {
      setSelectedSection(null);
    }
    toast({ title: "구역 삭제됨", description: `${deletedSection.name} 구역이 삭제되었습니다.` });
  };

  // 선택된 구역 정보 가져오기 (Get selected section details)
  const getSelectedSectionDetails = (): SectionDetail | null => {
    return sectionDetails.find(s => s.name === selectedSection) || null;
  };

  // 🔄 설정 저장 뮤테이션 (Settings save mutation)
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: any) => {
      const res = await apiRequest("POST", "/api/locker-settings", settingsData);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "설정 저장에 실패했습니다" }));
        throw new Error(errorData.error || "설정 저장에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "설정 저장 완료",
        description: data?.message || "락커 설정이 성공적으로 저장되었습니다.",
      });
      // 락커 목록 및 설정 새로고침
      queryClient.invalidateQueries({ queryKey: ["/api/lockers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locker-settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "설정 저장 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 📎 파일 업로드 핸들러 (File upload handler)
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 💾 설정 저장 핸들러 (Save settings handler)
  const handleSaveSettings = () => {
    // sectionDetails에서 sections 배열 동기화 (Sync sections from sectionDetails)
    const syncedSections = sectionDetails.map(s => s.name);
    
    // 구역이 없으면 저장 불가 경고 (Warn if no sections)
    if (syncedSections.length === 0) {
      toast({
        title: "구역 없음",
        description: "최소 하나의 구역을 추가해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    const settingsData = {
      sections: syncedSections, // 구역 목록 저장 (Save sections list) - 동기화됨
      sectionDetails, // 구역 상세정보 저장 (Save section details)
      displayName,
      currentManagement,
      accessLevel,
      securityLevel,
      lockerCount,
      startNumber,
      rowCount,
      columnCount,
      numberingType,
      layoutImage: uploadedImage,
    };

    saveSettingsMutation.mutate(settingsData);
    setSections(syncedSections); // 로컬 상태도 동기화 (Sync local state)
  };

  // 락커 수정 뮤테이션 (Locker update mutation)
  const updateLockerMutationSettings = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PUT", `/api/lockers/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "락커 수정에 실패했습니다" }));
        throw new Error(errorData.error || "락커 수정에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lockers"] });
      setShowEditLockerDialog(false);
      setEditingLocker(null);
      toast({ title: "락커 수정 완료", description: "락커 정보가 수정되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "락커 수정 실패", description: error.message, variant: "destructive" });
    },
  });

  // 🔄 락커 개수 변경 시 행 개수 자동 업데이트 (Auto update row count when locker count changes)
  const updateRowCount = (newLockerCount: number) => {
    setLockerCount(newLockerCount);
    setRowCount(Math.ceil(newLockerCount / columnCount));
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 통합된 설정 폼 - 중첩 탭 제거 (Unified settings form - removed nested tabs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* 왼쪽 설정 패널 */}
        <div className="space-y-6">
          {/* 구역 관리 설정 (Zone Management) - 표 형식 UI */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">구역 관리</CardTitle>
                  <p className="text-sm text-gray-500">배정 현황에 표시될 구역을 관리합니다</p>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setShowAddSectionDialog(true)} 
                  className="bg-orange-500 hover-elevate"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  구역 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sectionDetails.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">등록된 구역이 없습니다.</p>
                  <p className="text-xs text-gray-400 mt-1">구역을 추가하여 락커를 관리하세요.</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left p-2 md:p-3 font-medium text-gray-700">구역명</th>
                        <th className="text-left p-2 md:p-3 font-medium text-gray-700 hidden md:table-cell">추가자</th>
                        <th className="text-left p-2 md:p-3 font-medium text-gray-700 hidden md:table-cell">추가일</th>
                        <th className="text-center p-2 md:p-3 font-medium text-gray-700">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionDetails.map((section, index) => (
                        <tr 
                          key={index} 
                          className={`border-b last:border-b-0 hover-elevate cursor-pointer ${
                            selectedSection === section.name ? 'bg-orange-100' : ''
                          }`}
                          onClick={() => setSelectedSection(section.name)}
                        >
                          <td className="p-2 md:p-3 font-medium text-gray-900">{section.name}</td>
                          <td className="p-2 md:p-3 text-gray-600 hidden md:table-cell">{section.createdBy}</td>
                          <td className="p-2 md:p-3 text-gray-600 hidden md:table-cell">{section.createdAt}</td>
                          <td className="p-2 md:p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover-elevate"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSection(index);
                              }}
                              disabled={sectionDetails.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 락커 설정 - 구역 선택 시 표시 (Locker Settings - shown when section selected) */}
          {selectedSection && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">락커 설정</CardTitle>
                <p className="text-sm text-gray-500">선택된 구역의 설정을 수정합니다</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">구역명</label>
                    <Input 
                      value={selectedSection}
                      onChange={(e) => {
                        const newName = e.target.value;
                        const idx = sectionDetails.findIndex(s => s.name === selectedSection);
                        if (idx !== -1) {
                          const updated = [...sectionDetails];
                          updated[idx] = { ...updated[idx], name: newName };
                          setSectionDetails(updated);
                          // sections 배열도 동기화 (Sync sections array)
                          const sectionsUpdated = [...sections];
                          const sectionIdx = sectionsUpdated.indexOf(selectedSection);
                          if (sectionIdx !== -1) {
                            sectionsUpdated[sectionIdx] = newName;
                            setSections(sectionsUpdated);
                          }
                          setSelectedSection(newName);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">락커 개수</label>
                    <Input 
                      type="number"
                      value={getSelectedSectionDetails()?.lockerCount || 25}
                      onChange={(e) => {
                        const idx = sectionDetails.findIndex(s => s.name === selectedSection);
                        if (idx !== -1) {
                          const updated = [...sectionDetails];
                          updated[idx] = { ...updated[idx], lockerCount: Number(e.target.value) };
                          setSectionDetails(updated);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시작 번호</label>
                    <Input 
                      type="number"
                      value={getSelectedSectionDetails()?.startNumber || 1}
                      onChange={(e) => {
                        const idx = sectionDetails.findIndex(s => s.name === selectedSection);
                        if (idx !== -1) {
                          const updated = [...sectionDetails];
                          updated[idx] = { ...updated[idx], startNumber: Number(e.target.value) };
                          setSectionDetails(updated);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">행 개수</label>
                    <Input 
                      type="number"
                      value={getSelectedSectionDetails()?.rowCount || 3}
                      onChange={(e) => {
                        const idx = sectionDetails.findIndex(s => s.name === selectedSection);
                        if (idx !== -1) {
                          const updated = [...sectionDetails];
                          updated[idx] = { ...updated[idx], rowCount: Number(e.target.value) };
                          setSectionDetails(updated);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">열 개수</label>
                    <Input 
                      type="number"
                      value={getSelectedSectionDetails()?.columnCount || 10}
                      onChange={(e) => {
                        const idx = sectionDetails.findIndex(s => s.name === selectedSection);
                        if (idx !== -1) {
                          const updated = [...sectionDetails];
                          updated[idx] = { ...updated[idx], columnCount: Number(e.target.value) };
                          setSectionDetails(updated);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">월 이용료</label>
                    <Input 
                      type="number"
                      placeholder="기본 이용료 사용"
                      value={getSelectedSectionDetails()?.monthlyFee || ''}
                      onChange={(e) => {
                        const idx = sectionDetails.findIndex(s => s.name === selectedSection);
                        if (idx !== -1) {
                          const updated = [...sectionDetails];
                          updated[idx] = { ...updated[idx], monthlyFee: e.target.value ? Number(e.target.value) : undefined };
                          setSectionDetails(updated);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">비워두면 기본 이용료 적용</p>
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-md border border-orange-200 mt-4">
                  <p className="text-sm text-orange-700">
                    락커 번호: {getSelectedSectionDetails()?.startNumber || 1}번 ~ {(getSelectedSectionDetails()?.startNumber || 1) + (getSelectedSectionDetails()?.lockerCount || 25) - 1}번 ({getSelectedSectionDetails()?.lockerCount || 25}개)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 구역 추가 다이얼로그 (Add Section Dialog) */}
          <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 구역 추가</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">구역명</label>
                  <Input
                    placeholder="구역명을 입력하세요"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSectionWithDetails()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">락커 개수</label>
                    <Input 
                      type="number"
                      value={lockerCount}
                      onChange={(e) => updateRowCount(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시작 번호</label>
                    <Input 
                      type="number"
                      value={startNumber}
                      onChange={(e) => setStartNumber(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">행 개수</label>
                    <Input 
                      type="number"
                      value={rowCount}
                      onChange={(e) => setRowCount(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">열 개수</label>
                    <Input 
                      type="number"
                      value={columnCount}
                      onChange={(e) => setColumnCount(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
                  <p className="text-sm text-orange-700">
                    락커 번호: {startNumber}번 ~ {startNumber + lockerCount - 1}번 ({lockerCount}개)
                  </p>
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      setShowAddSectionDialog(false);
                      setNewSectionName("");
                    }}
                  >
                    취소
                  </Button>
                  <Button 
                    className="flex-1 bg-orange-500 hover-elevate text-white"
                    onClick={handleAddSectionWithDetails}
                    disabled={!newSectionName.trim()}
                  >
                    추가
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* 저장 버튼 */}
          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1" onClick={() => {
              setSections([]);
              setSectionDetails([]);
              setSelectedSection(null);
              setDisplayName("");
              setCurrentManagement("현관문");
              setAccessLevel("all");
              setSecurityLevel("basic");
              setLockerCount(25);
              setStartNumber(1);
              setRowCount(Math.ceil(25 / 10));
              setColumnCount(10);
              setNumberingType("sequential");
              setUploadedImage(null);
              setIsInitialized(false);
            }}>
              초기화
            </Button>
            <Button 
              className="flex-1 bg-orange-500 hover-elevate text-white"
              onClick={handleSaveSettings}
              disabled={saveSettingsMutation.isPending}
            >
              {saveSettingsMutation.isPending ? "저장 중..." : "설정 저장"}
            </Button>
          </div>
        </div>

        {/* 오른쪽 락커 배치 미리보기 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">락커 배치 미리보기</CardTitle>
              {selectedSection && (
                <p className="text-sm text-gray-500">
                  선택된 구역: <span className="font-medium text-orange-600">{selectedSection}</span>
                </p>
              )}
            </CardHeader>
            <CardContent>
              {!selectedSection ? (
                <div className="text-center py-12 text-gray-500">
                  <Settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">구역을 선택하면 락커 배치를 확인할 수 있습니다.</p>
                  <p className="text-xs text-gray-400 mt-1">왼쪽 구역 관리 표에서 구역을 클릭하세요.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 락커 그리드 미리보기 with 페이지네이션 */}
                  {(() => {
                    const totalLockers = getSelectedSectionDetails()?.lockerCount || 25;
                    const totalPages = Math.ceil(totalLockers / PREVIEW_PAGE_SIZE);
                    const startIdx = (previewPage - 1) * PREVIEW_PAGE_SIZE;
                    const endIdx = Math.min(startIdx + PREVIEW_PAGE_SIZE, totalLockers);
                    const currentPageLockers = Array.from({ length: endIdx - startIdx }).map((_, i) => startIdx + i);
                    
                    return (
                      <>
                        <div className="border rounded-lg p-4 bg-gray-50 overflow-auto">
                          <div 
                            className="grid gap-1"
                            style={{ 
                              gridTemplateColumns: `repeat(${getSelectedSectionDetails()?.columnCount || 10}, minmax(32px, 1fr))` 
                            }}
                          >
                            {currentPageLockers.map((index) => {
                              const lockerNumber = (getSelectedSectionDetails()?.startNumber || 1) + index;
                              return (
                                <div
                                  key={index}
                                  className="aspect-square border border-gray-300 rounded-md flex items-center justify-center text-xs font-medium bg-white hover-elevate cursor-pointer"
                                  title={`${lockerNumber}번 락커`}
                                >
                                  {lockerNumber}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* 미리보기 페이지네이션 */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center space-x-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewPage(Math.max(1, previewPage - 1))}
                              disabled={previewPage <= 1}
                            >
                              이전
                            </Button>
                            <span className="text-sm text-gray-600">
                              {previewPage} / {totalPages} 페이지 ({startIdx + 1}-{endIdx} / {totalLockers}개)
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewPage(Math.min(totalPages, previewPage + 1))}
                              disabled={previewPage >= totalPages}
                            >
                              다음
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  
                  {/* 범례 */}
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 pt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                      <span>빈 락커</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
                      <span>이용 중</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                      <span>만료</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* 락커 수정 다이얼로그 (Locker Edit Dialog) */}
      <Dialog open={showEditLockerDialog} onOpenChange={setShowEditLockerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>락커 수정 - {editingLocker?.number}번</DialogTitle>
          </DialogHeader>
          {editingLocker && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">구역</label>
                <Select 
                  value={editingLocker.section || ""} 
                  onValueChange={(value) => setEditingLocker({...editingLocker, section: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="구역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section) => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <Select 
                  value={editingLocker.status || "빈 락커"} 
                  onValueChange={(value) => setEditingLocker({...editingLocker, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="빈 락커">빈 락커</SelectItem>
                    <SelectItem value="이용 중">이용 중</SelectItem>
                    <SelectItem value="만료">만료</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">월 이용료</label>
                <Input 
                  type="number"
                  value={editingLocker.monthlyFee || 0}
                  onChange={(e) => setEditingLocker({...editingLocker, monthlyFee: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                <Input 
                  value={editingLocker.notes || ""}
                  onChange={(e) => setEditingLocker({...editingLocker, notes: e.target.value})}
                  placeholder="메모 입력"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setShowEditLockerDialog(false);
                    setEditingLocker(null);
                  }}
                >
                  취소
                </Button>
                <Button 
                  className="flex-1 bg-orange-500 hover-elevate"
                  onClick={() => {
                    updateLockerMutationSettings.mutate({
                      id: editingLocker.id,
                      data: {
                        section: editingLocker.section,
                        status: editingLocker.status,
                        monthlyFee: editingLocker.monthlyFee,
                        notes: editingLocker.notes,
                      }
                    });
                  }}
                  disabled={updateLockerMutationSettings.isPending}
                >
                  {updateLockerMutationSettings.isPending ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LockersPage({ selectedLockerId, onLockerSelect }: LockersPageProps = {}) {
  // 📋 UI 상태 관리 (UI state management)
  const [showAssignDialog, setShowAssignDialog] = useState(false); // 배정 대화상자 표시 (Show assignment dialog)
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null); // 선택된 사물함 (Selected locker)
  const [sectionFilter, setSectionFilter] = useState(""); // 섹션 필터 (Section filter) - 빈값으로 시작, lockerSettings 로드 후 설정
  const [searchTerm, setSearchTerm] = useState(""); // 검색어 (Search term)
  const [showRecoveryDetail, setShowRecoveryDetail] = useState(false); // 회수 상세 표시 (Show recovery detail)
  const [selectedRecovery, setSelectedRecovery] = useState<any>(null); // 선택된 회수 (Selected recovery)
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false); // 회수 대화상자 표시 (Show recovery dialog)
  const [showStatusDialog, setShowStatusDialog] = useState(false); // 상태 변경 대화상자 표시 (Show status dialog)
  const [showMemberAssignDialog, setShowMemberAssignDialog] = useState(false); // 회원 배정 대화상자 표시 (Show member assignment dialog)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null); // 선택된 회원 (Selected member)
  const [showLockerConfirmDialog, setShowLockerConfirmDialog] = useState(false); // 락커 확인 대화상자 표시 (Show locker confirmation dialog)
  const [selectedLockerForAssignment, setSelectedLockerForAssignment] = useState<any>(null); // 배정할 락커 (Locker for assignment)
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 (Current page for pagination)
  const [lockerStatusPage, setLockerStatusPage] = useState(1); // 락커 현황 페이지 (Locker status page)
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState("전체"); // 구매 상태 필터 (Purchase status filter)
  const [showLockerRegistrationPanel, setShowLockerRegistrationPanel] = useState(false); // 락커 등록 패널 표시 (Show locker registration panel)
  const [selectedMemberForRegistration, setSelectedMemberForRegistration] = useState<Member | null>(null); // 등록 대상 회원 (Member for registration)
  // 🆕 락커 등록 전용 폼 데이터 (Separate form data for locker registration panel)
  const [registrationFormData, setRegistrationFormData] = useState({
    section: "",
    number: undefined as number | undefined,
    startDate: "",
    endDate: "",
    monthlyFee: 30000,
    notes: "",
  });
  // 🆕 락커 상품 등록 폼 데이터 (Locker product registration form data)
  const [lockerProductFormData, setLockerProductFormData] = useState({
    name: "락커 이용권",
    price: 30000,
    duration: 1,
    durationType: "월",
    description: "",
  });
  const [showLockerProductForm, setShowLockerProductForm] = useState(false); // 락커 상품 등록 폼 표시 여부
  const [selectedLockerProduct, setSelectedLockerProduct] = useState<any>(null); // 선택된 락커 상품
  const itemsPerPage = 5; // 페이지당 항목 수 (Items per page)
  const LOCKER_PAGE_SIZE = 25; // 락커 현황 페이지 크기 (Locker status page size)
  const { toast } = useToast();

  // 📊 사물함 데이터 조회 (Fetch locker data)
  // 🔒 보안: 프랜차이즈별 사물함 데이터만 조회 (Security: Only fetch franchise-specific locker data)
  const { data: lockersList = [], isLoading, error, refetch } = useQuery<Locker[]>({
    queryKey: ["/api/lockers"],
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5분 캐시
  });

  // 👥 회원 목록 조회 (Fetch member list for assignment)
  const { data: membersList = [] } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  // 🔄 회수 기록 조회 (Locker recovery records query)
  const { data: recoveryRecords = [] } = useQuery<any[]>({
    queryKey: ["/api/locker-recoveries"],
  });

  // 📊 락커 설정 조회 - 구역 목록 연동 (Fetch locker settings for section sync)
  const { data: lockerSettings } = useQuery<any>({
    queryKey: ["/api/locker-settings"],
  });

  // 💰 결제 내역 조회 - 락커 상품 구매자 확인용 (Fetch payments for locker product purchaser check)
  const { data: paymentsList = [] } = useQuery<any[]>({
    queryKey: ["/api/payments"],
  });

  // 🛒 상품 목록 조회 - 락커 상품 확인용 (Fetch products for locker product check)
  const { data: productsList = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // 🆕 락커 상품 목록 계산 (Calculate locker products)
  const lockerProducts = useMemo(() => {
    return productsList.filter((p: any) => p.category === '락커' || p.category === '락커 상품' || p.name?.includes('락커'));
  }, [productsList]);

  // 🔄 lockerSettings 로드 시 sectionFilter 초기화 (Initialize sectionFilter when lockerSettings loads)
  // 구역 목록 계산 - sectionDetails 우선 사용 (Calculate available sections - prioritize sectionDetails)
  const availableSections = useMemo(() => {
    // sectionDetails가 있으면 그것에서 구역 이름 추출 (Extract section names from sectionDetails if available)
    const sectionDetailNames = lockerSettings?.sectionDetails?.map((s: any) => s.name) || [];
    const settingsSections = lockerSettings?.sections || [];
    const lockerSections = lockersList.map(l => l.section).filter(Boolean);
    const uniqueLockerSections = lockerSections.filter((section, index) => lockerSections.indexOf(section) === index);
    // sectionDetails 우선, 그 다음 sections, 마지막으로 기존 락커의 구역 (Priority: sectionDetails > sections > locker sections)
    const allSections = Array.from(new Set([...sectionDetailNames, ...settingsSections, ...uniqueLockerSections]));
    return allSections;
  }, [lockerSettings, lockersList]);

  useEffect(() => {
    // 현재 필터가 없거나 유효한 구역 목록에 없으면 첫 번째 구역으로 설정
    // 구역이 없으면 빈 문자열로 설정 (Guard against empty sections)
    if (availableSections.length === 0) {
      setSectionFilter("");
    } else if (!sectionFilter || !availableSections.includes(sectionFilter)) {
      setSectionFilter(availableSections[0] as string);
    }
  }, [availableSections, sectionFilter]);

  const form = useForm<Partial<InsertLocker>>({
    resolver: zodResolver(insertLockerSchema.partial()),
    defaultValues: {
      memberId: undefined,
      startDate: "",
      endDate: "",
      monthlyFee: 30000,
      notes: "",
    },
  });

  const updateLockerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertLocker> }) => {
      const res = await apiRequest("PUT", `/api/lockers/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "락커 업데이트에 실패했습니다" }));
        throw new Error(errorData.error || "락커 업데이트에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lockers"] });
      setShowAssignDialog(false);
      setShowRecoveryDialog(false);
      setShowStatusDialog(false);
      setSelectedLocker(null);
      form.reset();
      toast({
        title: "사물함 업데이트 완료",
        description: "사물함이 성공적으로 업데이트되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "사물함 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🔄 사물함 회수 뮤테이션 (Locker recovery mutation)
  const recoverLockerMutation = useMutation({
    mutationFn: async (lockerId: number) => {
      const res = await apiRequest("POST", `/api/lockers/${lockerId}/recover`, { recoveredBy: "관리자" });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "락커 회수에 실패했습니다" }));
        throw new Error(errorData.error || "락커 회수에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lockers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/locker-recoveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/member-lockers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      setShowRecoveryDialog(false);
      setSelectedLocker(null);
      toast({
        title: "사물함 회수 완료",
        description: "사물함이 성공적으로 회수되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createLockerMutation = useMutation({
    mutationFn: async (data: InsertLocker) => {
      const res = await apiRequest("POST", "/api/lockers", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "락커 생성에 실패했습니다" }));
        throw new Error(errorData.error || "락커 생성에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lockers"] });
      toast({
        title: "사물함 생성 완료",
        description: "사물함이 성공적으로 생성되었습니다.",
      });
    },
    onError: (error: Error) => {
      console.error("락커 생성 오류:", error);
      toast({
        title: "생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteLockerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/lockers/${id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "락커 삭제에 실패했습니다" }));
        throw new Error(errorData.error || "락커 삭제에 실패했습니다");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lockers"] });
      setSelectedLocker(null);
      toast({
        title: "락커 삭제 완료",
        description: "락커가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "삭제 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // 🔄 회원-락커 배정 뮤테이션 (Member-Locker assignment mutation)
  const createMemberLockerMutation = useMutation({
    mutationFn: async (data: { memberId: number; lockerId: number; startDate: string; endDate: string; monthlyFee: number }) => {
      const res = await apiRequest("POST", "/api/member-lockers", data);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "회원-락커 배정에 실패했습니다" }));
        throw new Error(errorData.error || "회원-락커 배정에 실패했습니다");
      }
      return res.status === 204 ? null : await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/member-lockers"] });
    },
    onError: (error: Error) => {
      console.error("회원-락커 배정 오류:", error);
    },
  });

  const handleDeleteLocker = (locker: Locker) => {
    if (locker.status === "이용 중") {
      toast({
        title: "삭제 불가",
        description: "이용 중인 락커는 삭제할 수 없습니다. 먼저 회수하세요.",
        variant: "destructive",
      });
      return;
    }
    if (confirm(`${locker.number}번 락커를 삭제하시겠습니까?`)) {
      deleteLockerMutation.mutate(locker.id);
    }
  };

  const onSubmit = (data: Partial<InsertLocker>) => {
    if (!selectedLocker) return;
    
    const updateData = {
      ...data,
      status: data.memberId ? "이용 중" : "빈 락커",
    };
    
    updateLockerMutation.mutate({ id: selectedLocker.id, data: updateData });
  };

  // 🔧 락커 상세/수정 다이얼로그 상태 (Locker detail/edit dialog state)
  const [showLockerDetailDialog, setShowLockerDetailDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);

  const handleLockerClick = (locker: Locker) => {
    setSelectedLocker(locker);
    // 모든 락커 클릭 시 상세/수정 다이얼로그 표시 (Show detail/edit dialog for all lockers)
    setEditFormData({
      section: locker.section || "",
      status: locker.status || "빈 락커",
      memberId: locker.memberId,
      monthlyFee: locker.monthlyFee || 30000,
      startDate: locker.startDate || "",
      endDate: locker.endDate || "",
      notes: locker.notes || "",
    });
    setShowLockerDetailDialog(true);
    onLockerSelect?.(locker.id);
  };

  // 🔄 사물함 회수 함수 - API 호출 (Locker recovery function - API call)
  const handleRecovery = () => {
    if (!selectedLocker) return;
    recoverLockerMutation.mutate(selectedLocker.id);
  };

  // 사물함 상태 변경 함수 (Locker status change function)
  const handleStatusChange = (newStatus: string) => {
    if (!selectedLocker) return;
    
    const updateData = {
      status: newStatus,
      notes: selectedLocker.notes || "",
    };
    
    updateLockerMutation.mutate({ id: selectedLocker.id, data: updateData });
  };

  // 회원 클릭 시 배정 대화상자 표시 (Show assignment dialog when member is clicked)
  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setShowMemberAssignDialog(true);
  };

  // 락커 선택 시 확인 대화상자 표시 (Show confirmation dialog when locker is selected)
  const handleLockerSelect = (locker: any) => {
    if (locker.status === "이용 중") {
      toast({
        title: "배정 불가",
        description: "해당 락커는 이미 배정되어 있습니다.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedLockerForAssignment(locker);
    setShowLockerConfirmDialog(true);
  };

  // 락커 배정 확인 처리 (Handle locker assignment confirmation)
  const handleLockerAssignmentConfirm = () => {
    if (!selectedMember || !selectedLockerForAssignment) return;
    
    // 실제 락커 ID 찾기 (Find actual locker ID)
    const actualLocker = lockersList.find(l => l.number === selectedLockerForAssignment.number);
    
    const updateData = {
      memberId: selectedMember.id,
      status: "이용 중",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30일 후
      monthlyFee: 30000,
      notes: `${selectedMember.name}님에게 배정됨`,
    };
    
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const monthlyFee = 30000;
    
    // 실제 락커가 존재하면 업데이트, 없으면 새로 생성
    if (actualLocker) {
      updateLockerMutation.mutate({ 
        id: actualLocker.id, 
        data: updateData 
      }, {
        onSuccess: () => {
          // memberLockers 테이블에도 배정 기록 추가
          createMemberLockerMutation.mutate({
            memberId: selectedMember.id,
            lockerId: actualLocker.id,
            startDate,
            endDate,
            monthlyFee,
          });
          
          // 성공 시 쿼리 무효화하여 UI 업데이트
          queryClient.invalidateQueries({ queryKey: ['/api/lockers'] });
          queryClient.invalidateQueries({ queryKey: ['/api/members'] });
          queryClient.invalidateQueries({ queryKey: ['/api/member-lockers'] });
          
          setShowLockerConfirmDialog(false);
          setShowMemberAssignDialog(false);
          setSelectedMember(null);
          setSelectedLockerForAssignment(null);
          
          toast({
            title: "배정 완료",
            description: `락커 ${selectedLockerForAssignment.number}번이 ${selectedMember.name}님에게 배정되었습니다.`,
          });
        },
        onError: (error) => {
          console.error('락커 배정 오류:', error);
          toast({
            title: "배정 실패",
            description: "락커 배정 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        }
      });
    } else {
      // 새 락커 생성
      const newLockerData = {
        number: selectedLockerForAssignment.number,
        section: sectionFilter || selectedLockerForAssignment.section || "구역1",
        type: "표준",
        status: "이용 중",
        memberId: selectedMember.id,
        startDate,
        endDate,
        monthlyFee,
        notes: `${selectedMember.name}님에게 배정됨`
      };
      
      createLockerMutation.mutate(newLockerData, {
        onSuccess: (createdLocker) => {
          // memberLockers 테이블에도 배정 기록 추가 (생성된 락커 ID 사용)
          if (createdLocker?.id) {
            createMemberLockerMutation.mutate({
              memberId: selectedMember.id,
              lockerId: createdLocker.id,
              startDate,
              endDate,
              monthlyFee,
            });
          } else {
            // 백엔드가 락커 ID를 반환하지 않은 경우 (정상적으로 발생하지 않음)
            console.warn('Created locker ID not returned, member-locker record not created');
          }
          
          // 성공 시 쿼리 무효화하여 UI 업데이트
          queryClient.invalidateQueries({ queryKey: ['/api/lockers'] });
          queryClient.invalidateQueries({ queryKey: ['/api/members'] });
          queryClient.invalidateQueries({ queryKey: ['/api/member-lockers'] });
          
          setShowLockerConfirmDialog(false);
          setShowMemberAssignDialog(false);
          setSelectedMember(null);
          setSelectedLockerForAssignment(null);
          
          toast({
            title: "배정 완료",
            description: `락커 ${selectedLockerForAssignment.number}번이 ${selectedMember.name}님에게 배정되었습니다.`,
          });
        },
        onError: (error) => {
          console.error('락커 생성 오류:', error);
          toast({
            title: "배정 실패",
            description: "락커 생성 중 오류가 발생했습니다.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const filteredLockers = lockersList
    .filter(locker => locker.section === sectionFilter)
    .filter(locker => {
      if (!searchTerm) return true;
      const member = membersList.find(m => m.id === locker.memberId);
      return locker.number.toString().includes(searchTerm) ||
             (member && member.name.toLowerCase().includes(searchTerm.toLowerCase()));
    });

  const getLockerStatusColor = (status: string) => {
    switch (status) {
      case "이용 중":
        return "bg-orange-100 text-orange-600 border-orange-200";
      case "만료":
        return "bg-red-100 text-red-600 border-red-200";
      case "빈 락커":
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getLockerBorderColor = (status: string) => {
    switch (status) {
      case "이용 중":
        return "border-orange-200 hover:border-orange-300";
      case "만료":
        return "border-red-200 hover:border-red-300";
      case "빈 락커":
      default:
        return "border-gray-200 hover:border-gray-300";
    }
  };

  // 🔍 락커 상품 ID 목록 가져오기 (Get locker product IDs)
  const lockerProductIds = useMemo(() => {
    return productsList
      .filter((p: any) => p.category === '락커' || p.category === '락커 상품' || p.name?.includes('락커'))
      .map((p: any) => p.id);
  }, [productsList]);

  // 💳 락커 상품을 구매한 회원 ID 목록 (Member IDs who purchased locker products)
  const lockerPurchaserIds = useMemo(() => {
    const purchaserIds = new Set<number>();
    paymentsList.forEach((payment: any) => {
      // 결제 내역의 description에 "락커"가 포함되거나, membership_id가 락커 상품인 경우
      if (payment.description?.includes('락커') || 
          lockerProductIds.includes(payment.membershipId)) {
        if (payment.memberId) {
          purchaserIds.add(payment.memberId);
        }
      }
    });
    return purchaserIds;
  }, [paymentsList, lockerProductIds]);

  // 🔍 회원별 락커 구매 여부 확인 함수 (Check if member purchased locker)
  const hasLockerPurchase = (memberId: number) => {
    return lockerPurchaserIds.has(memberId);
  };

  // 🔍 회원별 결제 정보 가져오기 (Get payment info for member)
  const getMemberLockerPayment = (memberId: number) => {
    return paymentsList.find((p: any) => 
      p.memberId === memberId && 
      (p.description?.includes('락커') || lockerProductIds.includes(p.membershipId))
    );
  };

  // Filter members who aren't assigned to lockers
  const unassignedMembers = useMemo(() => {
    let filtered = membersList.filter(member => {
      // 이미 락커에 배정된 회원 제외 (Exclude members already assigned to lockers)
      return !lockersList.some(locker => locker.memberId === member.id);
    });
    
    // 구매 상태 필터 적용 (Apply purchase status filter)
    if (purchaseStatusFilter === "구매자") {
      filtered = filtered.filter(member => hasLockerPurchase(member.id));
    } else if (purchaseStatusFilter === "미구매자") {
      filtered = filtered.filter(member => !hasLockerPurchase(member.id));
    }
    
    return filtered;
  }, [membersList, lockersList, purchaseStatusFilter, lockerPurchaserIds]);

  // 페이지네이션 계산 (Pagination calculations)
  const totalPages = Math.ceil(unassignedMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = unassignedMembers.slice(startIndex, endIndex);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">배정 현황</h2>
        </div>
      </div>



      {/* Main Tabs */}
      <Tabs defaultValue="배정 현황" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="배정 현황" className="data-[state=active]:bg-white text-xs md:text-sm">배정 현황</TabsTrigger>
          <TabsTrigger value="미배정자" className="data-[state=active]:bg-white text-xs md:text-sm">미배정자</TabsTrigger>
          <TabsTrigger value="회수 기록" className="data-[state=active]:bg-white text-xs md:text-sm">회수 기록</TabsTrigger>
          <TabsTrigger value="락커 설정" className="data-[state=active]:bg-white text-xs md:text-sm">락커 설정</TabsTrigger>
        </TabsList>

        {/* 배정 현황 Tab */}
        <TabsContent value="배정 현황" className="space-y-6">
          {/* Section Filter */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
            <div className="flex items-center space-x-4 overflow-x-auto">
              <div className="flex space-x-2 shrink-0">
                {/* 동적 섹션 탭: 락커 설정에서 가져온 구역 목록 (Dynamic section tabs: from locker settings) */}
                {(() => {
                  // 락커 설정에서 구역 목록 가져오기 (Get sections from locker settings)
                  const settingsSections = lockerSettings?.sections || [];
                  // 락커 데이터에서 고유 섹션 추출 (Extract unique sections from locker data)
                  const lockerSections = lockersList.map(l => l.section).filter(Boolean);
                  const uniqueLockerSections = lockerSections.filter((section, index) => lockerSections.indexOf(section) === index);
                  // 설정 구역과 락커 구역 합치기 (Merge settings sections and locker sections)
                  const allSections = Array.from(new Set([...settingsSections, ...uniqueLockerSections]));
                  // 섹션이 없으면 탭 표시 안함 (Don't show tabs if no sections)
                  const sections = allSections;
                  
                  return sections.map((section) => (
                    <Button
                      key={section}
                      variant={sectionFilter === section ? "default" : "outline"}
                      size="sm"
                      className={`rounded-full ${sectionFilter === section ? 'bg-orange-500 hover-elevate' : ''}`}
                      onClick={() => setSectionFilter(section as string)}
                    >
                      {section}
                    </Button>
                  ));
                })()}
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto">
              <Select defaultValue="상태 전체">
                <SelectTrigger className="w-28 md:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="상태 전체">상태 전체</SelectItem>
                  <SelectItem value="이용 중">이용 중</SelectItem>
                  <SelectItem value="빈 락커">빈 락커</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="hidden md:inline-flex">
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" className="hidden md:inline-flex">
                락커 번호
              </Button>
              <div className="relative">
                <Input
                  placeholder="검색"
                  className="w-40 md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Lockers Grid with Pagination */}
          {(() => {
            // 락커 설정이 없거나 sectionDetails가 비어있으면 안내 메시지 표시
            // (Show notice if locker settings not configured)
            const hasSectionDetails = lockerSettings?.sectionDetails && lockerSettings.sectionDetails.length > 0;
            const hasSections = lockerSettings?.sections && lockerSettings.sections.length > 0;
            
            if (!hasSectionDetails && !hasSections) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <Lock className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium mb-2">아직 락커가 설정되어 있지 않습니다</p>
                  <p className="text-sm text-gray-400 mb-4">락커 설정 탭에서 구역을 추가하여 락커를 설정해주세요</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const tabsElement = document.querySelector('[data-state="active"][value="락커 설정"]');
                      if (!tabsElement) {
                        // 탭 클릭 시뮬레이션
                        const settingsTab = document.querySelector('[value="락커 설정"]');
                        if (settingsTab) (settingsTab as HTMLElement).click();
                      }
                    }}
                  >
                    락커 설정으로 이동
                  </Button>
                </div>
              );
            }
            
            // 현재 구역의 락커 개수 가져오기 (Get locker count for current section)
            const currentSectionDetails = lockerSettings?.sectionDetails?.find(
              (s: any) => s.name === sectionFilter
            );
            const totalLockers = currentSectionDetails?.lockerCount || lockerSettings?.totalLockers || 25;
            const startNumber = currentSectionDetails?.startNumber || 1;
            const totalPages = Math.ceil(totalLockers / LOCKER_PAGE_SIZE);
            const startIdx = (lockerStatusPage - 1) * LOCKER_PAGE_SIZE;
            const endIdx = Math.min(startIdx + LOCKER_PAGE_SIZE, totalLockers);
            
            return (
              <>
                {/* Section Title */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>락커 현황 ({totalLockers}개)</span>
                  {totalPages > 1 && (
                    <span className="text-xs text-gray-400">
                      {startIdx + 1}-{endIdx} / {totalLockers}개
                    </span>
                  )}
                </div>

                {/* Lockers Grid */}
                {isLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
                    {[...Array(Math.min(LOCKER_PAGE_SIZE, totalLockers))].map((_, i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-16"></div>
                            <div className="h-3 bg-gray-200 rounded w-12"></div>
                            <div className="h-3 bg-gray-200 rounded w-20"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2 md:gap-4">
                    {Array.from({ length: endIdx - startIdx }).map((_, i) => {
                      const lockerNumber = startNumber + startIdx + i;
                      const existingLocker = lockersList.find(l => String(l.number) === String(lockerNumber) && l.section === sectionFilter);
                      // 🔧 상태 기반 배정 확인 (Status-based assignment check)
                      const inUseStatuses = ["이용 중", "사용중", "이용중"];
                      const isAssigned = existingLocker?.status ? 
                        inUseStatuses.includes(existingLocker.status) : false;
                      // 🔧 배정 상태이고 memberId가 있을 때만 회원 정보 표시 (Show member only when assigned and has memberId)
                      const member = isAssigned && existingLocker?.memberId ? 
                        membersList.find(m => m.id === existingLocker.memberId) : null;

                      
                      return (
                        <Card 
                          key={lockerNumber} 
                          className={`cursor-pointer border-2 ${
                            isAssigned 
                              ? "border-orange-200 bg-orange-50 hover:border-orange-300" 
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => {
                            if (existingLocker) {
                              handleLockerClick(existingLocker);
                            } else {
                              // 빈 락커 클릭 시 새 락커 생성용 다이얼로그 표시 (Show dialog for empty locker)
                              const emptyLocker = {
                                id: 0,
                                number: lockerNumber,
                                section: sectionFilter || "",
                                type: "표준",
                                status: "빈 락커",
                                memberId: null,
                                startDate: null,
                                endDate: null,
                                monthlyFee: 30000,
                                notes: "",
                                franchiseId: null,
                              } as Locker;
                              handleLockerClick(emptyLocker);
                            }
                          }}
                        >
                          <CardContent className="p-2 md:p-4">
                            <div className="space-y-1 md:space-y-2">
                              <div className="font-bold text-base md:text-lg text-center tabular-nums">{lockerNumber}</div>
                              <div className="flex justify-center">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    isAssigned 
                                      ? "bg-orange-100 text-orange-600" 
                                      : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {isAssigned ? "이용 중" : "빈 락커"}
                                </Badge>
                              </div>
                              <div className="text-center text-sm text-gray-500">
                                {member ? member.name : "-"}
                              </div>
                              <div className="text-center text-xs text-gray-500">
                                {isAssigned && existingLocker?.startDate ? String(existingLocker.startDate).split('T')[0] : "-"}
                              </div>
                              <div className="text-center text-xs text-gray-400">
                                {isAssigned ? existingLocker?.notes || "없음" : "없음"}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* 락커 현황 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLockerStatusPage(Math.max(1, lockerStatusPage - 1))}
                      disabled={lockerStatusPage <= 1}
                    >
                      이전
                    </Button>
                    <span className="text-sm text-gray-600">
                      {lockerStatusPage} / {totalPages} 페이지
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLockerStatusPage(Math.min(totalPages, lockerStatusPage + 1))}
                      disabled={lockerStatusPage >= totalPages}
                    >
                      다음
                    </Button>
                  </div>
                )}
              </>
            );
          })()}
        </TabsContent>

        {/* 미배정자 Tab */}
        <TabsContent value="미배정자" className="space-y-6">
          <Card className="bg-white">
            <CardAccentLine />
            <CardContent className="p-3 md:p-6">
              {/* 헤더 및 필터 영역 (Header and filter area) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2 md:gap-0">
                <span className="text-base md:text-lg font-bold">미배정자 명단 ({unassignedMembers.length}명)</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">상태:</span>
                  <Select value={purchaseStatusFilter} onValueChange={setPurchaseStatusFilter}>
                    <SelectTrigger className="w-32" data-testid="select-purchase-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">전체</SelectItem>
                      <SelectItem value="구매자">구매자</SelectItem>
                      <SelectItem value="미구매자">미구매자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[600px] md:min-w-0">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 md:p-3 text-sm font-medium">이름</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium hidden md:table-cell">회원 정보</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium">연락처</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium hidden md:table-cell">구매 상품</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium hidden md:table-cell">결제 일시</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium">상태</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium">배정</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unassignedMembers.length === 0 ? (
                      <tr>
                        <td className="p-8 text-center text-gray-500" colSpan={7}>
                          미배정자 데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      paginatedMembers.map((member) => {
                        const isPurchaser = hasLockerPurchase(member.id);
                        const payment = getMemberLockerPayment(member.id);
                        
                        return (
                          <tr 
                            key={member.id} 
                            className="hover-elevate cursor-pointer"
                            onClick={() => {
                              if (isPurchaser) {
                                handleMemberClick(member);
                              } else {
                                // 미구매자 클릭 시 우측 패널 열기 (Open panel for non-purchaser)
                                setRegistrationFormData({
                                  section: availableSections[0] || "",
                                  number: undefined,
                                  startDate: new Date().toISOString().split('T')[0],
                                  endDate: "",
                                  monthlyFee: 30000,
                                  notes: "",
                                });
                                setSelectedMemberForRegistration(member);
                                setShowLockerRegistrationPanel(true);
                              }
                            }}
                          >
                            <td className="p-2 md:p-3 text-sm text-gray-900 font-medium truncate">{member.name}</td>
                            <td className="p-2 md:p-3 text-sm text-gray-600 hidden md:table-cell">정회원</td>
                            <td className="p-2 md:p-3 text-sm text-gray-600">{formatPhoneNumber(member.phone)}</td>
                            <td className="p-2 md:p-3 text-sm text-gray-600 hidden md:table-cell">
                              {isPurchaser ? "락커" : "-"}
                            </td>
                            <td className="p-2 md:p-3 text-sm text-gray-600 hidden md:table-cell">
                              {payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('ko-KR') : "-"}
                            </td>
                            <td className="p-2 md:p-3">
                              <Badge 
                                variant="outline"
                                className={`text-xs ${isPurchaser ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
                              >
                                {isPurchaser ? "구매자" : "미구매자"}
                              </Badge>
                            </td>
                            <td className="p-2 md:p-3">
                              <Button
                                size="sm"
                                variant={isPurchaser ? "default" : "outline"}
                                className={`text-xs ${isPurchaser ? 'bg-orange-500 hover-elevate text-white' : 'border-orange-300 text-orange-600 hover-elevate'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isPurchaser) {
                                    handleMemberClick(member);
                                  } else {
                                    setRegistrationFormData({
                                      section: availableSections[0] || "",
                                      number: undefined,
                                      startDate: new Date().toISOString().split('T')[0],
                                      endDate: "",
                                      monthlyFee: 30000,
                                      notes: "",
                                    });
                                    setSelectedMemberForRegistration(member);
                                    setShowLockerRegistrationPanel(true);
                                  }
                                }}
                                data-testid={`button-assign-${member.id}`}
                              >
                                {isPurchaser ? "배정" : "등록"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* 페이지네이션 (Pagination) */}
                {unassignedMembers.length > itemsPerPage && (
                  <div className="flex flex-col md:flex-row items-center justify-between px-3 md:px-6 py-3 md:py-4 border-t border-gray-200 mt-4 gap-2 md:gap-0">
                    <div className="text-xs md:text-sm text-gray-600">
                      전체 {unassignedMembers.length}명 중 {startIndex + 1}-{Math.min(endIndex, unassignedMembers.length)}명 표시
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        이전
                      </Button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-orange-500 hover-elevate" : ""}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        다음
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 회수 기록 Tab */}
        <TabsContent value="회수 기록" className="space-y-6">
          <Card className="bg-white">
            <CardAccentLine />
            <CardContent className="p-3 md:p-6">
              <div className="mb-4">
                <span className="text-base md:text-lg font-bold">회수 내역 ({recoveryRecords.length})</span>
              </div>

              <div className="bg-white border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[600px] md:min-w-0">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 md:p-3 text-sm font-medium">이름</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium">락커 구역</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium">락커 번호</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium hidden md:table-cell">사유</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium">회수일</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium hidden md:table-cell">담당자</th>
                      <th className="text-left p-2 md:p-3 text-sm font-medium hidden md:table-cell">비고</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recoveryRecords.length === 0 ? (
                      <tr>
                        <td className="p-8 text-center text-gray-500" colSpan={7}>
                          회수 기록 데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      recoveryRecords.map((record) => (
                        <tr key={record.id} className="border-t hover-elevate">
                          <td className="p-2 md:p-3 text-sm">{record.memberName || '-'}</td>
                          <td className="p-2 md:p-3 text-sm">{record.lockerSection || '-'}</td>
                          <td className="p-2 md:p-3 text-sm tabular-nums">{record.lockerNumber}</td>
                          <td className="p-2 md:p-3 text-sm hidden md:table-cell">{record.reason || '-'}</td>
                          <td className="p-2 md:p-3 text-sm">
                            {record.recoveryDate ? String(record.recoveryDate).split('T')[0] : '-'}
                          </td>
                          <td className="p-2 md:p-3 text-sm hidden md:table-cell">{record.recoveredBy || '-'}</td>
                          <td className="p-2 md:p-3 text-sm hidden md:table-cell">{record.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 락커 설정 Tab */}
        <TabsContent value="락커 설정" className="space-y-6">
          <LockerSettingsTab />
        </TabsContent>
      </Tabs>

      {/* Recovery Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>사물함 회수</DialogTitle>
          </DialogHeader>
          {selectedLocker && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">사물함 번호:</span>
                  <span className="text-sm">{selectedLocker.number}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">현재 상태:</span>
                  <span className="text-sm">{selectedLocker.status}</span>
                </div>
                {selectedLocker.memberId && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">이용 회원:</span>
                    <span className="text-sm">
                      {membersList.find(m => m.id === selectedLocker.memberId)?.name || '알 수 없음'}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <p>사물함을 회수하시겠습니까?</p>
                <p>회수 후 사물함은 "빈 락커" 상태가 됩니다.</p>
              </div>
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-300 hover-elevate"
                  onClick={() => {
                    setShowRecoveryDialog(false);
                    handleDeleteLocker(selectedLocker);
                  }}
                  data-testid="button-delete-locker"
                >
                  락커 삭제
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowRecoveryDialog(false)}>
                    취소
                  </Button>
                  <Button onClick={handleRecovery} className="bg-red-500 hover-elevate">
                    회수
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>사물함 상태 변경</DialogTitle>
          </DialogHeader>
          {selectedLocker && (
            <div className="space-y-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">사물함 번호:</span>
                  <span className="text-sm">{selectedLocker.number}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">현재 상태:</span>
                  <span className="text-sm">{selectedLocker.status}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">새 상태 선택:</label>
                <div className="mt-2 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange("빈 락커")}
                  >
                    빈 락커
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange("이용 중")}
                  >
                    이용 중
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange("만료")}
                  >
                    만료
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleStatusChange("점검 중")}
                  >
                    점검 중
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                  취소
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recovery Detail Dialog */}
      <Dialog open={showRecoveryDetail} onOpenChange={setShowRecoveryDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>회수 기록 상세</DialogTitle>
          </DialogHeader>
          {selectedRecovery && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">회원명</label>
                  <div className="font-medium">{selectedRecovery.memberName}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">락커 번호</label>
                  <div className="font-medium">{selectedRecovery.lockerNumber}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">회수일</label>
                  <div className="font-medium">{selectedRecovery.recoveryDate}</div>
                </div>
                <div>
                  <label className="text-sm text-gray-600">사유</label>
                  <div className="font-medium">{selectedRecovery.reason}</div>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600">상세 내용</label>
                <div className="font-medium">{selectedRecovery.details}</div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setShowRecoveryDetail(false)}>
                  확인
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Assignment Dialog */}
      <Dialog open={showMemberAssignDialog} onOpenChange={setShowMemberAssignDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>락커 배정 - {selectedMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              빈 락커를 선택하여 {selectedMember?.name}님에게 배정하세요.
            </div>
            
            {/* Locker Grid for Assignment */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-2 max-h-96 overflow-y-auto">
              {[...Array(25)].map((_, i) => {
                const lockerNumber = i + 1;
                const existingLocker = lockersList.find(l => String(l.number) === String(lockerNumber));
                const isAssigned = existingLocker?.memberId != null;
                const memberName = existingLocker?.memberId ? 
                  membersList.find(m => m.id === existingLocker.memberId)?.name : null;
                
                const locker = {
                  id: existingLocker?.id || lockerNumber,
                  number: lockerNumber.toString(),
                  status: isAssigned ? "이용 중" : "빈 락커",
                  memberName: memberName,
                };
                
                return (
                  <Card 
                    key={lockerNumber} 
                    className={`cursor-pointer border-2 ${
                      isAssigned 
                        ? "border-orange-200 bg-orange-50" 
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                    onClick={() => handleLockerSelect(locker)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <div className="font-bold text-sm text-center">{lockerNumber}</div>
                        <div className="flex justify-center">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              isAssigned 
                                ? "bg-orange-100 text-orange-600" 
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {isAssigned ? "이용 중" : "빈 락커"}
                          </Badge>
                        </div>
                        <div className="text-center text-xs text-gray-500">
                          {memberName || "-"}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowMemberAssignDialog(false)}>
                취소
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Locker Confirmation Dialog */}
      <Dialog open={showLockerConfirmDialog} onOpenChange={setShowLockerConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>락커 배정 확인</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium">
                {selectedMember?.name}님을 {selectedLockerForAssignment?.number}번 락커에 배정하시겠습니까?
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setShowLockerConfirmDialog(false)}
              >
                아니오
              </Button>
              <Button 
                className="bg-orange-500 hover-elevate"
                onClick={handleLockerAssignmentConfirm}
              >
                예
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 🔧 락커 상세/수정 다이얼로그 (Locker Detail/Edit Dialog) */}
      <Dialog open={showLockerDetailDialog} onOpenChange={setShowLockerDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>락커 {selectedLocker?.number}번</span>
              <Badge 
                variant="outline"
                className={
                  editFormData?.status === "이용 중" ? "bg-orange-100 text-orange-600" :
                  editFormData?.status === "만료" ? "bg-red-100 text-red-600" :
                  "bg-gray-100 text-gray-600"
                }
              >
                {editFormData?.status || "빈 락커"}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {editFormData && (
            <div className="space-y-4">
              {/* 회원 정보 표시 (Member info display) */}
              {editFormData.memberId && (
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-700">
                    배정 회원: {membersList.find(m => m.id === editFormData.memberId)?.name || "알 수 없음"}
                  </p>
                </div>
              )}

              {/* 구역 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">구역</label>
                <Select 
                  value={editFormData.section} 
                  onValueChange={(value) => setEditFormData({...editFormData, section: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="구역 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {(lockerSettings?.sections && lockerSettings.sections.length > 0 ? lockerSettings.sections : availableSections.length > 0 ? availableSections : ["기본"]).map((section: string) => (
                      <SelectItem key={section} value={section}>{section}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 상태 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <Select 
                  value={editFormData.status} 
                  onValueChange={(value) => setEditFormData({...editFormData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="빈 락커">빈 락커</SelectItem>
                    <SelectItem value="이용 중">이용 중</SelectItem>
                    <SelectItem value="만료">만료</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 월 이용료 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">월 이용료</label>
                <Input 
                  type="number"
                  value={editFormData.monthlyFee}
                  onChange={(e) => setEditFormData({...editFormData, monthlyFee: Number(e.target.value)})}
                />
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                <Input 
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                  placeholder="메모 입력"
                />
              </div>

              {/* 버튼 */}
              <div className="flex space-x-2 pt-4 border-t">
                {editFormData.status === "이용 중" && editFormData.memberId && (
                  <Button 
                    variant="outline"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {
                      setShowLockerDetailDialog(false);
                      setShowRecoveryDialog(true);
                    }}
                  >
                    회수
                  </Button>
                )}
                <div className="flex-1" />
                <Button 
                  variant="outline"
                  onClick={() => setShowLockerDetailDialog(false)}
                >
                  취소
                </Button>
                <Button 
                  className="bg-orange-500 hover-elevate"
                  onClick={() => {
                    if (selectedLocker) {
                      // 🔧 빈 락커(id: 0)일 경우 POST로 생성, 그렇지 않으면 PUT으로 수정
                      if (selectedLocker.id === 0) {
                        // 새 락커 생성 (Create new locker) - 숫자 타입 정규화
                        createLockerMutation.mutate({
                          number: Number(selectedLocker.number),
                          section: editFormData.section || "기본",
                          type: "표준",
                          status: editFormData.status || "빈 락커",
                          memberId: editFormData.memberId ? Number(editFormData.memberId) : undefined,
                          monthlyFee: Number(editFormData.monthlyFee) || 0,
                          notes: editFormData.notes || "",
                        } as InsertLocker);
                      } else {
                        // 기존 락커 수정 (Update existing locker)
                        updateLockerMutation.mutate({
                          id: selectedLocker.id,
                          data: {
                            section: editFormData.section,
                            status: editFormData.status,
                            monthlyFee: editFormData.monthlyFee,
                            notes: editFormData.notes,
                          }
                        });
                      }
                      setShowLockerDetailDialog(false);
                    }
                  }}
                  disabled={updateLockerMutation.isPending || createLockerMutation.isPending}
                >
                  {(updateLockerMutation.isPending || createLockerMutation.isPending) ? "저장 중..." : "저장"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🆕 락커 등록 우측 패널 (Locker Registration Right Panel) */}
      <Sheet open={showLockerRegistrationPanel} onOpenChange={setShowLockerRegistrationPanel}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">락커 등록</SheetTitle>
          </SheetHeader>
          
          {selectedMemberForRegistration && (
            <div className="space-y-6 mt-6">
              {/* 회원 정보 (Member Info) */}
              <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">이름</span>
                    <span className="text-sm font-medium text-gray-900">{selectedMemberForRegistration.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">연락처</span>
                    <span className="text-sm font-medium text-gray-900">{formatPhoneNumber(selectedMemberForRegistration.phone)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">이메일</span>
                    <span className="text-sm font-medium text-gray-900">{selectedMemberForRegistration.email || "-"}</span>
                  </div>
                  {/* 선택된 상품 표시 (Show selected product) */}
                  {selectedLockerProduct && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">선택 상품</span>
                      <span className="text-sm font-medium text-orange-600">
                        {selectedLockerProduct.name} ({selectedLockerProduct.price?.toLocaleString()}원)
                      </span>
                    </div>
                  )}
              </div>

              {/* 🆕 락커 상품이 없으면 상품 등록 폼 표시 (Show product registration form if no locker products) */}
              {(lockerProducts.length === 0 || showLockerProductForm) && (
                <div className="space-y-4 bg-orange-50 p-5 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-orange-700">락커 상품 등록</h3>
                    {lockerProducts.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowLockerProductForm(false)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        취소
                      </Button>
                    )}
                  </div>
                  {lockerProducts.length === 0 && (
                    <p className="text-sm text-orange-600">등록된 락커 상품이 없습니다. 먼저 락커 상품을 등록해주세요.</p>
                  )}
                  
                  {/* 상품명 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상품명 *</label>
                    <Input 
                      value={lockerProductFormData.name}
                      onChange={(e) => setLockerProductFormData({...lockerProductFormData, name: e.target.value})}
                      placeholder="예: 락커 이용권"
                    />
                  </div>
                  
                  {/* 가격 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">가격 (원) *</label>
                    <Input 
                      type="number"
                      value={lockerProductFormData.price}
                      onChange={(e) => setLockerProductFormData({...lockerProductFormData, price: Number(e.target.value)})}
                      placeholder="30000"
                    />
                  </div>
                  
                  {/* 유효기간 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">유효기간</label>
                      <Input 
                        type="number"
                        value={lockerProductFormData.duration}
                        onChange={(e) => setLockerProductFormData({...lockerProductFormData, duration: Number(e.target.value)})}
                        placeholder="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">단위</label>
                      <Select 
                        value={lockerProductFormData.durationType}
                        onValueChange={(value) => setLockerProductFormData({...lockerProductFormData, durationType: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="일">일</SelectItem>
                          <SelectItem value="주">주</SelectItem>
                          <SelectItem value="월">월</SelectItem>
                          <SelectItem value="년">년</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* 상품 설명 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상품 설명</label>
                    <Input 
                      value={lockerProductFormData.description}
                      onChange={(e) => setLockerProductFormData({...lockerProductFormData, description: e.target.value})}
                      placeholder="상품에 대한 간단한 설명"
                    />
                  </div>
                  
                  {/* 상품 등록 버튼 */}
                  <Button 
                    className="w-full bg-orange-500 hover-elevate"
                    onClick={async () => {
                      if (!lockerProductFormData.name || !lockerProductFormData.price) {
                        toast({
                          title: "입력 오류",
                          description: "상품명과 가격을 입력해주세요.",
                          variant: "destructive",
                        });
                        return;
                      }
                      
                      try {
                        await apiRequest("POST", "/api/products", {
                          name: lockerProductFormData.name,
                          price: lockerProductFormData.price,
                          category: "락커",
                          duration: `${lockerProductFormData.duration}${lockerProductFormData.durationType}`,
                          description: lockerProductFormData.description || "",
                          status: "활성",
                          appExposed: false,
                        });
                        
                        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
                        
                        toast({
                          title: "상품 등록 완료",
                          description: "락커 상품이 등록되었습니다.",
                        });
                        
                        setShowLockerProductForm(false);
                        setLockerProductFormData({
                          name: "락커 이용권",
                          price: 30000,
                          duration: 1,
                          durationType: "월",
                          description: "",
                        });
                      } catch (error) {
                        toast({
                          title: "등록 실패",
                          description: "상품 등록에 실패했습니다.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    락커 상품 등록
                  </Button>
                </div>
              )}

              {/* 락커 상품이 있고 상품 등록 폼이 아닐 때만 락커 배정 폼 표시 */}
              {lockerProducts.length > 0 && !showLockerProductForm && (
                <>
                  {/* 락커 상품 선택 (Select locker product) */}
                  <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-700">락커 상품 선택</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowLockerProductForm(true)}
                        className="text-orange-600 hover:text-orange-800 text-xs"
                      >
                        + 새 상품 추가
                      </Button>
                    </div>
                    
                    {/* 상품 목록 (Product list) */}
                    <div className="space-y-2">
                      {lockerProducts.map((product: any) => (
                        <div 
                          key={product.id}
                          onClick={() => {
                            setSelectedLockerProduct(product);
                            setRegistrationFormData(prev => ({
                              ...prev,
                              monthlyFee: product.price || 30000
                            }));
                          }}
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedLockerProduct?.id === product.id
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-200 hover:border-orange-300 hover-elevate'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-900">{product.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({product.duration || "1개월"})</span>
                            </div>
                            <span className="font-bold text-orange-600">{product.price?.toLocaleString()}원</span>
                          </div>
                          {product.description && (
                            <p className="text-xs text-gray-500 mt-1">{product.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

              {/* 락커 배정 폼 - 상품 선택 후에만 표시 (Locker Assignment Form - only show after product selection) */}
              {selectedLockerProduct && (
              <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">락커 배정</h3>
                
                {/* 구역 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">구역 선택</label>
                  <Select 
                    value={registrationFormData.section || ""} 
                    onValueChange={(value) => setRegistrationFormData({...registrationFormData, section: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="구역 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSections.map((section) => (
                        <SelectItem key={section as string} value={section as string}>{section}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 락커 번호 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">락커 번호</label>
                  <Select 
                    value={registrationFormData.number?.toString() || ""}
                    onValueChange={(value) => setRegistrationFormData({...registrationFormData, number: Number(value)})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="락커 번호 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* 빈 락커만 표시 (Show only empty lockers) */}
                      {(() => {
                        const sectionDetails = lockerSettings?.sectionDetails?.find(
                          (s: any) => s.name === registrationFormData.section
                        );
                        const totalLockers = sectionDetails?.lockerCount || 25;
                        const startNum = sectionDetails?.startNumber || 1;
                        const availableNumbers = [];
                        
                        for (let i = 0; i < totalLockers; i++) {
                          const num = startNum + i;
                          const isOccupied = lockersList.some(l => 
                            l.number === num && 
                            l.section === registrationFormData.section && 
                            l.status === "이용 중"
                          );
                          if (!isOccupied) {
                            availableNumbers.push(num);
                          }
                        }
                        
                        return availableNumbers.map(num => (
                          <SelectItem key={num} value={num.toString()}>{num}번</SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>

                {/* 이용 기간 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                    <Input 
                      type="date"
                      value={registrationFormData.startDate || ""}
                      onChange={(e) => setRegistrationFormData({...registrationFormData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
                    <Input 
                      type="date"
                      value={registrationFormData.endDate || ""}
                      onChange={(e) => setRegistrationFormData({...registrationFormData, endDate: e.target.value})}
                    />
                  </div>
                </div>

                {/* 월 이용료 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">월 이용료</label>
                  <Input 
                    type="number"
                    value={registrationFormData.monthlyFee || 30000}
                    onChange={(e) => setRegistrationFormData({...registrationFormData, monthlyFee: Number(e.target.value)})}
                    placeholder="30000"
                  />
                </div>

                {/* 메모 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
                  <Input 
                    value={registrationFormData.notes || ""}
                    onChange={(e) => setRegistrationFormData({...registrationFormData, notes: e.target.value})}
                    placeholder="메모 입력"
                  />
                </div>

                {/* 등록 버튼 */}
              <div className="flex space-x-2 pt-4 border-t">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowLockerRegistrationPanel(false);
                    setSelectedMemberForRegistration(null);
                  }}
                >
                  취소
                </Button>
                <Button 
                  className="flex-1 bg-orange-500 hover-elevate"
                  onClick={() => {
                    if (!registrationFormData.section || !registrationFormData.number) {
                      toast({
                        title: "입력 오류",
                        description: "구역과 락커 번호를 선택해주세요.",
                        variant: "destructive",
                      });
                      return;
                    }

                    // 락커 생성 및 회원 배정 (Create locker and assign member)
                    createLockerMutation.mutate({
                      number: Number(registrationFormData.number),
                      section: registrationFormData.section,
                      type: "표준",
                      status: "이용 중",
                      memberId: selectedMemberForRegistration.id,
                      startDate: registrationFormData.startDate || new Date().toISOString().split('T')[0],
                      endDate: registrationFormData.endDate || "",
                      monthlyFee: Number(registrationFormData.monthlyFee) || 30000,
                      notes: registrationFormData.notes || `${selectedMemberForRegistration.name}님에게 배정됨`,
                    } as InsertLocker, {
                      onSuccess: () => {
                        // 결제 내역도 함께 생성 (Create payment record)
                        apiRequest("POST", "/api/payments", {
                          memberId: selectedMemberForRegistration.id,
                          amount: Number(registrationFormData.monthlyFee) || 30000,
                          paymentMethod: "카드",
                          description: "락커 이용료",
                          status: "완료",
                        }).catch(console.error);

                        queryClient.invalidateQueries({ queryKey: ["/api/lockers"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
                        
                        toast({
                          title: "등록 완료",
                          description: `${selectedMemberForRegistration.name}님에게 ${registrationFormData.number}번 락커가 배정되었습니다.`,
                        });
                        
                        setShowLockerRegistrationPanel(false);
                        setSelectedMemberForRegistration(null);
                        setRegistrationFormData({
                          section: "",
                          number: undefined,
                          startDate: "",
                          endDate: "",
                          monthlyFee: 30000,
                          notes: "",
                        });
                      }
                    });
                  }}
                  disabled={createLockerMutation.isPending}
                >
                  {createLockerMutation.isPending ? "등록 중..." : "락커 등록 및 배정"}
                </Button>
              </div>
              </div>
              )}
              </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default LockersPage;