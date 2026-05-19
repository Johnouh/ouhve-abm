<!--#include file="include/ServiceConst.asp"-->
<%
	Response.Expires = -1
	Response.AddHeader"Pragma","no-cache"
	Response.CacheControl="no-cache"
	Response.ContentType ="text/html;charset=euc-kr"

	'변수 정의
	Dim SERVICE_ID, ORDER_DATE, ORDER_ID, USER_ID, USER_NAME, ITEM_CODE, ITEM_NAME
	Dim USER_EMAIL, USER_IP, DEAL_AMOUNT, VAT, SERVICE_CHARGE
	Dim CURRENCY, OPCODE, MOBILE_NUMBER, RETURN_URL

	Dim payObj, result
	Dim RESPONSE_CODE, RESPONSE_MESSAGE, DETAIL_RESPONSE_CODE, DETAIL_RESPONSE_MESSAGE
	Dim TRANSACTION_ID

	'결제 정보 받아오기
	SERVICE_ID			= request.Form("SERVICE_ID")			'가맹점 ID
	ORDER_DATE			= request.Form("ORDER_DATE")			'주문일시
	ORDER_ID			= request.Form("ORDER_ID")				'주문번호
	USER_ID				= request.Form("USER_ID")				'고객 아이디
	USER_NAME			= request.Form("USER_NAME")				'고객명
	ITEM_CODE			= request.Form("ITEM_CODE")				'상품코드
	ITEM_NAME			= request.Form("ITEM_NAME")				'상품명
	USER_EMAIL			= request.Form("USER_EMAIL")			'고객 이메일
	DEAL_AMOUNT			= request.Form("DEAL_AMOUNT")			'결제 금액
	VAT					= request.Form("VAT")					'부가세
	SERVICE_CHARGE		= request.Form("SERVICE_CHARGE")		'봉사료
	MOBILE_NUMBER		= request.Form("MOBILE_NUMBER")			'콜백SMS 수신 휴대폰번호
	RETURN_URL			= request.Form("RETURN_URL")			'콜백URL 리턴 URL
	CURRENCY		= request.Form("CURRENCY")			'승인통화(원화)
	OPCODE				= request.Form("OPCODE")				'언어구분(한글)
	RETURN_URL			= request.Form("RETURN_URL")			'RETURN URL
	
	USER_IP				= request.ServerVariables("Remote_ADDR")'고객 아이피

	set payObj = server.CreateObject("GalaxiaApi.Pay")
	result = payObj.LoadConfig(DLL_PATH, SVCCODE_CREDIT_CARD, WORK_TYPE)

	if result < 0 Then
		response.write "에러 코드 : 0902\n에러 메시지 : 가맹점 주문요청 결과(설정파일 읽기 실패)! 관리자에게 문의 하세요!"
		response.end
	End If

	payObj.SetCommand(COMMAND_ORDER_REQUEST)			'콜백 주문요청
	payObj.SetCrypto(CRYPTO_MODE)						'암호화 모드
	payObj.SetVersion(API_VERSION)						'API 버전
	payObj.SetMid(SERVICE_ID)							'가맹점 ID
	payObj.SetServiceCode(SVCCODE_CREDIT_CARD)			'서비스 코드
	payObj.SetOrderID(ORDER_ID)							'주문번호
	payObj.SetOrderDate(ORDER_DATE)						'주문일시

	payObj.SetTagValue "0001", USER_ID					'고객 아이디
	payObj.SetTagValue "0002", USER_NAME				'고객명
	payObj.SetTagValue "0003", ITEM_CODE				'상품코드
	payObj.SetTagValue "0004", ITEM_NAME				'상품명
	payObj.SetTagValue "0005", USER_IP					'고객 아이피
	payObj.SetTagValue "0006", USER_EMAIL				'고객 이메일
	payObj.SetTagValue "0007", MOBILE_NUMBER			'콜백SMS 수신 휴대폰번호
	payObj.SetTagValue "0012", DEAL_AMOUNT				'결제 금액
	payObj.SetTagValue "0013", VAT						'부가세
	payObj.SetTagValue "0014", SERVICE_CHARGE			'봉사료
	payObj.SetTagValue "0030", CURRENCY			'승인통화(원화)
	payObj.SetTagValue "0070", OPCODE					'언어구분(한글)
	payObj.SetTagValue "1023", RETURN_URL				'RETURN URL

	payObj.Run(RUN_MODE)								'0:테스트모드, 1:상용모드

	payObj.GetTagValue "1001", TRANSACTION_ID			'거래번호
	payObj.GetTagValue "1002", RESPONSE_CODE			'결과코드
	payObj.GetTagValue "1003", RESPONSE_MESSAGE			'결과메세지
	payObj.GetTagValue "1009", DETAIL_RESPONSE_CODE		'상세 결과코드
	payObj.GetTagValue "1010", DETAIL_RESPONSE_MESSAGE	'상세 결과메세지

	set payObj = Nothing
%>
<html>
<head>
<title>신용카드 콜백 주문요청 결과</title>
<meta http-equiv="Content-Type" content="text/html; charset=euc-kr">
<link href="css/css_admin.css" rel="stylesheet" type="text/css">
<link href="css/css_01.css" rel="stylesheet" type="text/css">
<head>
<!-- 키 방어 코드 -->
<script type="text/javascript" src="./js/comm.js"></script>
<script language="JavaScript">
	function checkSubmit(){
		var HForm = document.payment;

		HForm.action = "http://tpay.billgate.net/credit/cb.jsp";	//테스트
		
		var option ="width=440,height=750,titlebar=no,fullscreen=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,left=150,top=150";
		var objPopup = window.open("", "payment", option);
	 
		if(objPopup == null){	//팝업 차단여부 확인
			alert("팝업이 차단되어 있습니다.\n팝업차단을 해제하신 뒤 다시 시도하여 주십시오.");
		}
		

		HForm.submit();
	}
</script>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">	
<table width="450" border="0" cellpadding="0"	cellspacing="0">
	<tr> 
	  <td height="25" background="images/top_bg02.gif" style="padding-left:10px" class="title01">신용카드 &gt; <b>콜백 주문요청 결과</b></td>
	</tr>
	<tr>
		<td>&nbsp;</td>
	</tr>
	<tr>
		<td align="center"><!--본문테이블 시작--->
		<table width="450" border="0" cellpadding="4" cellspacing="1" bgcolor="#B0B0B0">	
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>가맹점 아이디</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=SERVICE_ID%></b>
				</td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>서비스 코드</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=SVCCODE_CREDIT_CARD%></b>
				</td>
			</tr>
				<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>주문번호</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=ORDER_ID%></b>
				</td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>거래번호</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=TRANSACTION_ID%></b>
				</td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>응답코드</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=RESPONSE_CODE%></b>
				</td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>응답메시지</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=RESPONSE_MESSAGE%></b>
				</td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>상세응답코드</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=DETAIL_RESPONSE_CODE%></b>
				</td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>상세응답메시지</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=DETAIL_RESPONSE_MESSAGE%></b>
				</td>
			</tr>
		</table>
		<!-- 비인증SMS 결제창 호출-->
		<%
			If RESPONSE_CODE = "0000" Then
		%>
		<table width="450" border="0" cellpadding="5" cellspacing="1" bgcolor="#B0B0B0">
			<form name="payment" method="post" target="payment">
				<input type="hidden" name="TRXID" value="<%=TRANSACTION_ID%>" />
			</form>
			<tr>
				<td align="center" bgcolor="#FFFFFF" colspan="2"><input type="button" value="결제창 호출" onclick="javascript:checkSubmit();"></a></td>
			</tr>
		</table>
		<%
			End If
		%>
		</td>
	</tr>
</table>
</body>
</html>