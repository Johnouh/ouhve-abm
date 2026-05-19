<%@ page contentType="text/html; charset=euc-kr" %>
<%@ page import="java.text.* "%>
<%@ page import="java.util.* "%>
<%@ page import="com.galaxia.api.util.*"%>
<%
	String serviceId = null;
	String orderId = null;
	String orderDate = null;
	String userId = null;
	String userName = null;
	String itemName = null;
	String itemCode = null;
	String dealAmount = null;
	String userIp = null;
	String returnUrl = null;
	String currency = null;
	String opcode = null;
	
	try {
		request.setCharacterEncoding("euc-kr");
		//만료된 페이지 설정
		response.setHeader("cache-control", "no-cache");
		response.setHeader("pragma", "no-cache");
		response.setHeader("expire", "0");
	
		
		//날짜변수 선언 
		Calendar today = Calendar.getInstance(); 
		String year = Integer.toString(today.get(Calendar.YEAR));
		String month = Integer.toString(today.get(Calendar.MONTH)+1);
		String date = Integer.toString(today.get(Calendar.DATE));
		String hour = Integer.toString(today.get(Calendar.HOUR_OF_DAY));	
		String minute = Integer.toString(today.get(Calendar.MINUTE));
		String second = Integer.toString(today.get(Calendar.SECOND));	
	
		if(today.get(Calendar.MONTH)+1 < 10) month = "0" + month ;	
		if(today.get(Calendar.DATE) < 10) date = "0" + date ;
		if(today.get(Calendar.HOUR) < 10) hour = "0" + hour ;	
		if(today.get(Calendar.MINUTE) < 10) minute = "0" + minute ;	
		if(today.get(Calendar.SECOND) < 10) second = "0" + second ;	
		
		//결제 요청 파라메터
		serviceId = "M2103140" ; //콜백방식용 테스트 아이디 : M2103140
		orderDate = year + month + date + hour + minute + second ; //주문일시
		orderId = "test_" + orderDate ;  //주문번호
		userId = "testid" ; 
		userName = "홍길동";
		itemName = "콜백방식 테스트상품";
		itemCode = "callback";
		dealAmount = "1000";
		userIp = "127.0.0.1";
		returnUrl = "http://10.50.10.148:8080/neptune/credit/callback/pay_callback_return.jsp";

		//-----------고정 값 수정 불가------------
		currency			= "0000";									//승인통화(원화)
		opcode				= "0000";									//언어구분(한글)
		//-----------고정 값 수정 불가-----------
	
%>
<html>
<head>
<title>결제요청</title>
<meta http-equiv="Content-Type" content="text/html; charset=euc-kr">
<link href="css/css_admin.css" rel="stylesheet" type="text/css">
<link href="css/css_01.css" rel="stylesheet" type="text/css">
<script language="JavaScript">
function checkSubmit(){
	document.charset = "euc-kr";
	var HForm = document.payment;
	HForm.action = "pay_callback_proc.jsp";
	HForm.submit();
}
</script>
</head>
<!--Header끝-->
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">
<form name="payment" method="post" accept-charset="euc-kr">
<table width="800" border="0" cellpadding="0" cellspacing="0">
	<tr> 
	  <td height="25" background="images/top_bg02.gif" style="padding-left:10px" class="title01"><img src="images/top_icon01.gif" align="absmiddle">신용카드 결제 &gt; <b>결제요청 테스트</b></td>
	</tr>
	<tr>
		<td>&nbsp;</td>
	</tr>
	<tr>
		<td align="center">
		<!--본문테이블 시작--->
		<table width="750" border="0" cellpadding="5" cellspacing="1" bgcolor="#B0B0B0">
			<tr>
				<td colspan="2" height="30" align="left" bgcolor="#F6F6F6"><b>콜백URL 주문요청 정보입력(굵은 글씨:필수항목)</b></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>서비스아이디</b></td>
				<td bgcolor="#FFFFFF">&nbsp;<%=serviceId%><input type="hidden" name="SERVICE_ID" value="<%=serviceId%>"></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>주문번호</b></td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="ORDER_ID" class="input" value="<%=orderId%>"></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>주문일시</b></td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="ORDER_DATE" size=20 class="input" value="<%=orderDate%>"></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6">고객 아이디</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="USER_ID" size=20 class="input" value="<%=userId%>"></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6">고객명</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="USER_NAME" size=20 class="input" value="<%=userName%>"></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>상품코드</b></td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="ITEM_CODE" size=20 class="input" value="<%=itemCode%>"></td>	
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6">상품명</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="ITEM_NAME" size=20 class="input" value="<%=itemName%>"></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6">고객E-mail</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="USER_EMAIL" size=20 class="input" value=""></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6">고객 IP</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="USER_IP" size=20 class="input" value="<%=userIp%>"></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>결제 금액</b></td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="DEAL_AMOUNT" value="<%=dealAmount%>"></td>
			</tr>	
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6">부가세</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="VAT" value=""></td>
			</tr>							
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6">봉사료</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="SERVICE_CHARGE" value=""></td>
			</tr>							
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>승인통화(원화)</b></td>
				<td bgcolor="#FFFFFF">&nbsp;<%=currency %><input type="hidden"	name="CURRENCY" value="<%=currency %>"> (고정 값)</td>
			</tr>		
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>언어구분(한글)</b></td>
				<td bgcolor="#FFFFFF">&nbsp;<%=opcode %><input type="hidden"	name="OPCODE" value="<%=opcode %>"> (고정 값)</td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>SMS 수신 휴대폰번호</b></td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="MOBILE_NUMBER" ></td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>가맹점 RETURN_URL</b></td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	size=70 name="RETURN_URL" value="<%=returnUrl %>"></td>
			</tr>
		</table>
		<table width="750" border="0" cellpadding="5" cellspacing="1" bgcolor="#B0B0B0">	
			<tr>
				<td align="center" bgcolor="#FFFFFF" colspan="2"><img src="images/bt_submit01.gif" OnClick="javascript:checkSubmit();" style="cursor: hand;"></td>
			</tr>
		</table>
		<!--본문테이블 끝--->
		</td>
	</tr>
	<tr>
		<td align="center"></td>
	</tr>
</table>
</form>
</body>
</html>
<%
	} catch (Exception ex) {
		ex.printStackTrace();
%>
<script type="text/javascript">
	alert("에러 코드 : 0901\n에러 메시지 : 정보입력창(pay)! 관리자에게 문의 하세요!");
	window.close();
	</script>
<%
	}
%>