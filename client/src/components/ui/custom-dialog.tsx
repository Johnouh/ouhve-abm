// 🎨 커스텀 팝업 다이얼로그 (Custom Popup Dialog)
// 🎯 Purpose: 백드롭 블러 효과가 있는 사용자 친화적 확인 팝업 (User-friendly confirmation popup with backdrop blur effect)

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert' | 'delete';
  children?: ReactNode;
}

export function CustomDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  type = 'confirm',
  children
}: CustomDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getButtonStyle = () => {
    switch (type) {
      case 'delete':
        return 'bg-red-500 hover:bg-red-600 text-white border-red-500';
      case 'confirm':
        return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500';
      default:
        return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleBackdropClick}
      style={{ backdropFilter: 'blur(4px)' }}
    >
      {/* 백드롭 블러 효과 - 웹사이트 디자인과 일치 */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      {/* 팝업 컨테이너 - 홈페이지 카드 스타일과 일치 */}
      <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 max-w-md w-full mx-4 p-6 transform transition-all duration-300 scale-100">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* 제목 */}
        <h2 className="text-xl font-semibold text-gray-900 mb-3 pr-8">
          {title}
        </h2>
        
        {/* 설명 */}
        {description && (
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {description}
          </p>
        )}
        
        {/* 커스텀 콘텐츠 */}
        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}
        
        {/* 버튼 영역 */}
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 py-2 border-gray-300 hover:bg-gray-50"
          >
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              onClick={onConfirm}
              className={`px-4 py-2 transition-colors ${getButtonStyle()}`}
            >
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// 🚨 삭제 확인 팝업 (Delete Confirmation Popup)
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  itemName?: string;
}) {
  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title || "삭제 확인"}
      description={description || `${itemName || '이 항목'}을 정말로 삭제하시겠습니까?`}
      confirmText="삭제"
      cancelText="취소"
      type="delete"
    />
  );
}

// 📋 앱 노출 확인 팝업 (App Exposure Confirmation Popup)
export function AppExposeConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  isCurrentlyExposed,
  productName,
  title,
  description
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCurrentlyExposed?: boolean;
  productName?: string;
  title?: string;
  description?: string;
}) {
  const defaultTitle = isCurrentlyExposed ? "APP 노출 해제 확인" : "APP 노출 확인";
  const defaultDescription = isCurrentlyExposed 
    ? `'${productName || '이 상품'}'을 앱에서 노출 해제하시겠습니까?` 
    : `'${productName || '이 상품'}'을 앱에 노출하시겠습니까?`;
  const confirmText = isCurrentlyExposed ? "노출 해제" : "노출하기";
  
  return (
    <CustomDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title || defaultTitle}
      description={description || defaultDescription}
      confirmText={confirmText}
      cancelText="취소"
      type="confirm"
    />
  );
}