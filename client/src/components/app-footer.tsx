// 앱 공통 푸터 컴포넌트 (App Common Footer Component)
// 사이드바/결제 터미널 하단에 사업자 정보 표시

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
            <p className="text-[10px] text-gray-400 leading-relaxed">
              사업자등록번호 112-88-03313 | 대표자 강용신
            </p>
            <p className="text-[10px] text-gray-400">
              Tel. 070-8828-1001
            </p>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              용인시 수지구 수지로 342번길 32, 5층 503호/504호
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
        OUHVE ABM | 대표 강용신
      </p>
      <p className="text-[10px] text-gray-400 leading-relaxed">
        사업자등록번호 112-88-03313
      </p>
      <p className="text-[10px] text-gray-400">
        Tel. 070-8828-1001
      </p>
      <p className="text-[10px] text-gray-400 leading-relaxed">
        용인시 수지구 수지로 342번길 32, 5층 503호/504호
      </p>
      <p className="text-[10px] text-gray-300 mt-1">
        &copy; {new Date().getFullYear()} OUHVE ABM
      </p>
    </div>
  );
}
