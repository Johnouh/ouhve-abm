// 앱 공통 푸터 컴포넌트 (App Common Footer Component)
// 사업자 정보는 OUHVE 법인 확정 시 채움 (현재는 카피라이트만)

interface AppFooterProps {
  variant?: "sidebar" | "vertical";
}

export function AppFooter({ variant = "sidebar" }: AppFooterProps) {
  if (variant === "vertical") {
    return (
      <footer className="mt-8 pb-4 px-2">
        <div className="border-t border-gray-200 pt-4">
          <div className="text-center space-y-1">
            <p className="text-[11px] font-medium text-gray-500">
              OUHVE ABM
            </p>
            <p className="text-[10px] text-gray-300 mt-2">
              &copy; {new Date().getFullYear()} OUHVE ABM. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  // sidebar variant
  return (
    <div className="px-3 py-3 border-t border-gray-100">
      <p className="text-[10px] text-gray-400 leading-relaxed">
        OUHVE ABM
      </p>
      <p className="text-[10px] text-gray-300 mt-1">
        &copy; {new Date().getFullYear()} OUHVE ABM
      </p>
    </div>
  );
}
