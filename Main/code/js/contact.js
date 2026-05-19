/**
 * GL allpay — contact.js
 * 상담 신청 폼 처리 및 데이터 저장
 */

(function () {
  'use strict';

  /* ─── File Upload ─── */
  const fileDropArea = document.getElementById('fileDropArea');
  const fileInput = document.getElementById('fileInput');
  const fileList = document.getElementById('fileList');
  let selectedFiles = [];

  if (fileDropArea && fileInput) {
    // 클릭으로 파일 선택
    fileDropArea.addEventListener('click', () => fileInput.click());

    // 드래그 & 드롭
    fileDropArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileDropArea.style.borderColor = 'var(--gold)';
      fileDropArea.style.background = 'rgba(201,168,76,0.08)';
    });

    fileDropArea.addEventListener('dragleave', () => {
      fileDropArea.style.borderColor = '';
      fileDropArea.style.background = '';
    });

    fileDropArea.addEventListener('drop', (e) => {
      e.preventDefault();
      fileDropArea.style.borderColor = '';
      fileDropArea.style.background = '';
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
    });

    fileInput.addEventListener('change', () => {
      const files = Array.from(fileInput.files);
      addFiles(files);
      fileInput.value = '';
    });
  }

  function addFiles(files) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    files.forEach((file) => {
      if (file.size > maxSize) {
        showToast(`"${file.name}"은 10MB를 초과합니다.`, 'error');
        return;
      }
      if (!selectedFiles.find((f) => f.name === file.name)) {
        selectedFiles.push(file);
      }
    });
    renderFileList();
  }

  function renderFileList() {
    if (!fileList) return;
    fileList.innerHTML = '';
    selectedFiles.forEach((file, idx) => {
      const item = document.createElement('div');
      item.style.cssText = `
        display:flex;align-items:center;justify-content:space-between;
        padding:10px 16px;background:rgba(201,168,76,0.06);
        border:1px solid rgba(201,168,76,0.15);border-radius:6px;
        font-size:0.82rem;color:var(--text-sub);
      `;
      item.innerHTML = `
        <span>📄 ${escapeHtml(file.name)} <span style="color:var(--gray-text);font-size:0.75rem;">(${formatFileSize(file.size)})</span></span>
        <button type="button" data-idx="${idx}" style="background:none;border:none;color:var(--gold);cursor:pointer;font-size:1rem;padding:2px 6px;" aria-label="파일 삭제">×</button>
      `;
      item.querySelector('button').addEventListener('click', () => {
        selectedFiles.splice(idx, 1);
        renderFileList();
      });
      fileList.appendChild(item);
    });
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }


  /* ─── Form Validation ─── */
  function validateForm(data) {
    const errors = [];

    if (!data.bizName.trim()) errors.push('사업자명을 입력해주세요.');
    if (!data.bizNum.trim()) errors.push('사업자등록번호를 입력해주세요.');
    if (!data.repName.trim()) errors.push('대표자명을 입력해주세요.');
    if (!data.phone.trim()) errors.push('연락처를 입력해주세요.');
    if (!data.email.trim()) {
      errors.push('이메일을 입력해주세요.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('올바른 이메일 형식을 입력해주세요.');
    }
    if (!data.privacyAgree) errors.push('개인정보처리방침에 동의해주세요.');

    return errors;
  }


  /* ─── Form Submit ─── */
  const contactForm = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // 폼 데이터 수집
      const formData = new FormData(contactForm);
      const installmentValue = formData.get('installment') || '';

      const data = {
        bizName: (document.getElementById('bizName')?.value || '').trim(),
        bizNum: (document.getElementById('bizNum')?.value || '').trim(),
        repName: (document.getElementById('repName')?.value || '').trim(),
        phone: (document.getElementById('phone')?.value || '').trim(),
        email: (document.getElementById('email')?.value || '').trim(),
        industry: (document.getElementById('industry')?.value || '').trim(),
        operatingPeriod: (document.getElementById('operatingPeriod')?.value || '').trim(),
        contractPeriod: (document.getElementById('contractPeriod')?.value || '').trim(),
        prepayRatio: (document.getElementById('prepayRatio')?.value || '').trim(),
        installment: installmentValue,
        pgStatus: (document.getElementById('pgStatus')?.value || '').trim(),
        message: (document.getElementById('message')?.value || '').trim(),
        privacyAgree: document.getElementById('privacyAgree')?.checked || false,
        filesCount: selectedFiles.length,
        submittedAt: new Date().toISOString(),
      };

      // Validation
      const errors = validateForm(data);
      if (errors.length > 0) {
        showToast(errors[0], 'error');
        highlightError(errors);
        return;
      }

      // 버튼 비활성화
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '신청 중...';
        submitBtn.style.opacity = '0.7';
      }

      try {
        // API 저장
        const response = await fetch('tables/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            biz_name: data.bizName,
            biz_num: data.bizNum,
            rep_name: data.repName,
            phone: data.phone,
            email: data.email,
            industry: data.industry,
            operating_period: data.operatingPeriod,
            contract_period: data.contractPeriod,
            prepay_ratio: data.prepayRatio,
            installment: data.installment,
            pg_status: data.pgStatus,
            message: data.message,
            files_count: data.filesCount,
            status: 'pending',
            submitted_at: data.submittedAt,
          }),
        });

        if (!response.ok) throw new Error('서버 오류');

        // 성공 처리
        showSubmitSuccess();
      } catch (err) {
        console.error('폼 제출 오류:', err);
        showToast('신청 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = '운영 구조 검토 신청하기';
          submitBtn.style.opacity = '';
        }
      }
    });
  }


  function highlightError(errors) {
    // 에러 필드 강조
    const fieldMap = {
      '사업자명': 'bizName',
      '사업자등록번호': 'bizNum',
      '대표자명': 'repName',
      '연락처': 'phone',
      '이메일': 'email',
    };

    Object.entries(fieldMap).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (errors.some((e) => e.includes(key))) {
        el.style.borderColor = '#e74c3c';
        el.addEventListener('input', () => { el.style.borderColor = ''; }, { once: true });
      }
    });
  }


  function showSubmitSuccess() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.innerHTML = `
      <div style="text-align:center;padding:60px 20px;">
        <div style="width:72px;height:72px;background:rgba(201,168,76,0.1);border:2px solid var(--gold);
                    border-radius:50%;display:flex;align-items:center;justify-content:center;
                    margin:0 auto 28px;font-size:2rem;">✓</div>
        <h3 style="font-size:1.4rem;font-weight:700;color:var(--white);margin-bottom:16px;letter-spacing:-0.01em;">
          신청이 접수되었습니다.
        </h3>
        <p style="font-size:0.9rem;color:var(--text-sub);line-height:1.9;margin-bottom:32px;">
          운영 구조 적합 여부를 검토 후<br>
          기재하신 연락처로 연락드리겠습니다.<br>
          <br>
          모든 신청이 동일하게 진행되지는 않습니다.<br>
          기준에 맞는 경우, 다음 단계가 안내됩니다.
        </p>
        <a href="index.html" style="
          display:inline-flex;align-items:center;gap:8px;
          padding:14px 32px;background:var(--gold);color:var(--navy);
          border-radius:4px;font-weight:600;font-size:0.9rem;
          text-decoration:none;transition:all 0.3s;
        " onmouseover="this.style.background='var(--gold-light)'" onmouseout="this.style.background='var(--gold)'">
          홈으로 돌아가기
        </a>
      </div>
    `;

    // 성공 토스트
    setTimeout(() => {
      if (window.showToast) window.showToast('신청이 접수되었습니다! 검토 후 연락드리겠습니다.', 'success');
    }, 400);
  }

})();
