<%@ page contentType="text/html; charset=euc-kr" %>
<%@	include file="process_callback.jsp" %>

<%
//---------------------------------------------------------------------------------------------------------------
// 가맹점 결과 처리 페이지 -- 수정 불가
//---------------------------------------------------------------------------------------------------------------
//요청 파라미터
String serviceId = null ;
String orderId = null ;
String orderDate = null ;
String userId = null;
String userName = null;
String itemCode = null;
String itemName = null;
String userEmail = null;
String userIp = null;
String dealAmount = null;
String vat = null;
String serviceCharge = null;
String mobileNumber = null;
String currency = null;
String opcode = null;
String returnUrl = null;

//응답 파라미터
String serviceCode = null ;
String transactionId = null;
String responseCode = null;
String responseMessage = null;
String detailResponseCode = null;
String detailResponseMessage = null;
String authNumber = null;
String authDate = null;
String authAmount = null;

try{
	request.setCharacterEncoding("euc-kr");
	
	//만료된 페이지 설정
	response.setHeader("cache-control", "no-cache");
	response.setHeader("pragma", "no-cache"); 
	response.setHeader("expire", "0");
	
	//결제 정보 받아오기
	serviceId = request.getParameter("SERVICE_ID");
	orderId = request.getParameter("ORDER_ID");
	orderDate = request.getParameter("ORDER_DATE");
	userId = request.getParameter("USER_ID");
	userName = request.getParameter("USER_NAME");
	itemCode = request.getParameter("ITEM_CODE");
	itemName = request.getParameter("ITEM_NAME");
	userEmail = request.getParameter("USER_EMAIL");
	userIp = request.getParameter("USER_IP");
	dealAmount = request.getParameter("DEAL_AMOUNT");
	vat = request.getParameter("VAT");
	serviceCharge = request.getParameter("SERVICE_CHARGE");
	mobileNumber = request.getParameter("MOBILE_NUMBER");
	currency = request.getParameter("CURRENCY");
	opcode = request.getParameter("OPCODE");
	returnUrl = request.getParameter("RETURN_URL");
	
                                                          
	//결제 정보 session에 저장
	session.setAttribute("serviceId", serviceId);
	session.setAttribute("orderId", orderId);
	session.setAttribute("orderDate", orderDate);
	session.setAttribute("userId", userId);
	session.setAttribute("userName", userName);
	session.setAttribute("itemCode", itemCode);
	session.setAttribute("itemName", itemName);
	session.setAttribute("userEmail", userEmail);
	session.setAttribute("userIp", userIp);
	session.setAttribute("dealAmount", dealAmount);
	session.setAttribute("vat", vat);
	session.setAttribute("serviceCharge", serviceCharge);
	session.setAttribute("mobileNumber", mobileNumber);
	session.setAttribute("currency", currency);
	session.setAttribute("opcode", opcode);
	session.setAttribute("returnUrl", returnUrl);
	
			
		//승인요청
		Message respMsg = smsRequestProcess(session, config);

		//승인요청에 대한 응답 결과 설정
		serviceCode = respMsg.getServiceCode();		
		responseCode = respMsg.get(MessageTag.RESPONSE_CODE);
		responseMessage = respMsg.get(MessageTag.RESPONSE_MESSAGE);
		detailResponseCode = respMsg.get(MessageTag.DETAIL_RESPONSE_CODE);
		detailResponseMessage = respMsg.get(MessageTag.DETAIL_RESPONSE_MESSAGE);
		transactionId = respMsg.get(MessageTag.TRANSACTION_ID);

 
//---------------------------------------------------------------------------------------------------------------
// 가맹점 결과 처리 페이지 -- 수정 불가 끝
//---------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------
// 가맹점 수정 부분 : 가맹점 처리 부분 시작
//---------------------------------------------------------------------------------------------------------------

%>
<html>
<head>
<title></title>
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
<table width="500" border="0" cellpadding="0"	cellspacing="0">
	<tr> 
	  <td height="25" style="padding-left:10px" class="title01"> 
		# 현재위치 &gt;&gt; 신용카드 &gt; <b>콜백URL SMS 발송요청 결과</b></td>
	</tr>
	<!--히스토리-->
	<!--title-->
	<tr>
		<td height="54" background="images/manager_title01.gif"
			style="padding-left: 65px; padding-top: 18px"><font size="3"><strong>가맹점 Return Url</strong></font></td>
	</tr>
	<!--title-->
	<tr>
		<td>&nbsp;</td>
	</tr>
	<tr>
		<td align="center"><!--본문테이블 시작--->
		<table width="450" border="0" cellpadding="4" cellspacing="1" bgcolor="#B0B0B0">	
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>가맹점 아이디</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=serviceId%></b>
				</td>								
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>서비스 코드</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=serviceCode%></b>
				</td>								
			</tr>
				<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>주문번호</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=orderId%></b>
				</td>								
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>거래번호</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=transactionId%></b>
				</td>								
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>응답코드</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=responseCode%></b>
				</td>								
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>응답메시지</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=responseMessage%></b>
				</td>								
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>상세응답코드</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=detailResponseCode%></b>
				</td>								
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>상세응답메시지</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=detailResponseMessage%></b>
				</td>								
			</tr>
		</table>
		</td>
	</tr>
</table>

<!-- 
	비인증SMS 결제창 호출 : 웹으로 호출해볼 수 있도록 제공하는 부분이며, 개발용으로만 사용해야 함.
-->
<%
	if("0000".equals(responseCode)) {
%>
		<table width="450" border="0" cellpadding="5" cellspacing="1" bgcolor="#B0B0B0">
			<form name="payment" method="post" target="payment">
				<input type="hidden" name="TRXID" value="<%=transactionId%>" />
			</form>
			<tr>
				<td align="center" bgcolor="#FFFFFF" colspan="2"><input type="button" value="결제창 호출" onclick="javascript:checkSubmit();"></a></td>
			</tr>
		</table>
<%
	}
%>
</body>
</html>
<%
//---------------------------------------------------------------------------------------------------------------
// 가맹점 수정 부분 : 결제 가맹점 처리 부분 끝
//---------------------------------------------------------------------------------------------------------------
}
catch(Exception ex) {
	ex.printStackTrace();
%>
	<script type="text/javascript">
	alert("에러 코드 : 0902\n 서버 로그확인 필요!");
	window.close();
	</script>
<%
}
%>