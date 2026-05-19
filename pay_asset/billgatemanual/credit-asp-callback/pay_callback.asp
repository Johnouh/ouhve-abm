<!--#include file="include/ServiceConst.asp"-->
<%
	Function GetTime()
		GetTime = Year(now) & Right("0" & Month(now),2) & Right("0" & Day(now),2) & Right("0" & Hour(now),2) & Right("0" & Minute(now),2) & Right("0" & Second(now),2)
	End Function
%>
<%
	Response.Expires = -1
	Response.AddHeader"Pragma","no-cache"
	Response.CacheControl="no-cache"
	Response.ContentType ="text/html;charset=euc-kr"

	'변수 정의
	Dim SERVICE_ID, ORDER_DATE, ORDER_ID, USER_ID, USER_NAME, ITEM_CODE, ITEM_NAME
	Dim USER_EMAIL, USER_IP, DEAL_AMOUNT, VAT, SERVICE_CHARGE
	Dim CURRENCY, OPCODE, MOBILE_NUMBER, RETURN_URL


	'결제 요청 파라미터
	SERVICE_ID			= "M2103140"								'가맹점 ID (콜백 테스트 아이디 : M2103140)
	ORDER_DATE			= GetTime()									'주문일시
	ORDER_ID			= "test_" & ORDER_DATE						'주문번호
	USER_ID				= "testid"									'고객 아이디
	USER_NAME			= "홍길동"									'고객명
	ITEM_CODE			= "TEST_CD1"								'상품코드
	ITEM_NAME			= "테스트상품"								'상품명
	USER_EMAIL			= ""										'고객 이메일
	USER_IP				= Request.ServerVariables("Remote_ADDR")	'고객 아이피
	DEAL_AMOUNT			= "1000"									'결제 금액
	VAT					= ""										'부가세
	SERVICE_CHARGE		= ""										'봉사료
	MOBILE_NUMBER		= ""										'콜백SMS 수신 휴대폰번호
	RETURN_URL			= "http://도메인(IP)/credit_callback/pay_callback_return.asp"	'콜백URL 리턴 URL

	'-----------고정 값 수정 불가------------
	CURRENCY		= "0000"									'승인통화(원화)
	OPCODE				= "0000"									'언어구분(한글)
	'-----------고정 값 수정 불가-----------

%>
<html>
<head>
<title>신용카드 콜백 주문요청</title>
<meta http-equiv="Content-Type" content="text/html; charset=euc-kr">
<link href="css/css_admin.css" rel="stylesheet" type="text/css">
<link href="css/css_01.css" rel="stylesheet" type="text/css">
<script language="JavaScript">
function checkSubmit(){
	var HForm = document.payment;
	HForm.action = "pay_callback_proc.asp";
	HForm.submit();
}
</script>
</head>
<!--Header끝-->
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">
<form name="payment" method="post">
<table width="450" border="0" cellpadding="0" cellspacing="0">
	<tr> 
	  <td height="25" background="images/top_bg02.gif" style="padding-left:10px" class="title01">신용카드 &gt; <b>콜백 주문요청 테스트</b></td>
	</tr>
	<tr>
		<td>&nbsp;</td>
	</tr>
	<tr>
		<td align="center">
		<!--본문테이블 시작--->
		<table width="450" border="0" cellpadding="5" cellspacing="1" bgcolor="#B0B0B0">
			<tr>
				<td colspan="2" height="30" align="left" bgcolor="#F6F6F6"><b>공통정보 정보입력</b></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">서비스아이디</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="SERVICE_ID" size=20 class="input" value="<%=SERVICE_ID%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">주문번호</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="ORDER_ID" size=20 class="input" value="<%=ORDER_ID%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">주문일시</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="ORDER_DATE" size=20 class="input" value="<%=ORDER_DATE%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">상품명</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="ITEM_NAME" size=20 class="input" value="<%=ITEM_NAME%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">상품코드</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="ITEM_CODE" size=20 class="input" value="<%=ITEM_CODE%>"></td>	
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">고객 아이디</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="USER_ID" size=20 class="input" value="<%=USER_ID%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">고객명</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="USER_NAME" size=20 class="input" value="<%=USER_NAME%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">고객E-mail</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text" name="USER_EMAIL" size=20 class="input" value="<%=USER_EMAIL%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">고객 IP</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="USER_IP" size=20 class="input" value="<%=USER_IP%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">결제 금액</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="DEAL_AMOUNT" size=20 class="input" value="<%=DEAL_AMOUNT%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">부가세</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="VAT" size=20 class="input" value="<%=VAT%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">봉사료</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="SERVICE_CHARGE" size=20 class="input" value="<%=SERVICE_CHARGE%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">전화번호</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="MOBILE_NUMBER" size=20 class="input" value="<%=MOBILE_NUMBER%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">RETURN URL</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="RETURN_URL" size=20 class="input" value="<%=RETURN_URL%>"></td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">승인통화(원화)</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="CURRENCY" size=20 class="input" readonly value="<%=CURRENCY%>"> (고정 값)</td>
			</tr>
			<tr>
				<td width="200" align="center" bgcolor="#F6F6F6">언어구분(한글)</td>
				<td bgcolor="#FFFFFF">&nbsp;<input type="text"	name="OPCODE" size=20 class="input" readonly value="<%=OPCODE%>"> (고정 값)</td>
			</tr>
		</table>
		<table width="450" border="0" cellpadding="5" cellspacing="1" bgcolor="#B0B0B0">	
			<tr>
				<td align="center" bgcolor="#FFFFFF" colspan="2"><input type="button" value="주문(SMS 전송)" onclick="javascript:checkSubmit();"></a></td>
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