<!--#include file="include/ServiceConst.asp"-->
<%
Function GetTime()
	GetTime = Year(now) & Right("0" & Month(now),2) & Right("0" & Day(now),2) & Right("0" & Hour(now),2) & Right("0" & Minute(now),2) & Right("0" & Second(now),2)
End function

dim serviceId, orderID, orderDate, transactionId, authAmount

serviceId		= "M2103140"				' 가맹점 ID (비인증 테스트 아이디 : S1600881)
orderId			= "test_" & GetTime()		' 주문번호는 Unique 하게 생성 해야함
orderDate		= GetTime()					' 정확한 주문일시 생성해야함 (가맹점 기준일 시로 사용함)
transactionId	= "2016040617TT005028"		' 갤럭시아 거래번호
authAmount		= "1000"					' 결제 완료 건의 금액

'취소 요청
dim payObj, result
dim outTRANS, responseCode, responseMessage, detailResponseCode, detailResponseMessage

set payObj = server.CreateObject("GalaxiaApi.Pay")

result = payObj.LoadConfig(DLL_PATH, SVCCODE_CREDIT_CARD, WORK_TYPE)

if result < 0 Then
	response.write "에러 코드 : 0902\n에러 메시지 : 인증 결제창 에러(설정파일 읽기 실패)! 관리자에게 문의 하세요!"
	session.abandon
	response.end
end if

payObj.SetCrypto(CRYPTO_MODE)
payObj.SetVersion(API_VERSION)
payObj.SetMid(serviceId)
payObj.SetServiceCode(SVCCODE_CREDIT_CARD)
payObj.SetCommand(COMMAND_CANCEL_SMS_REQUEST)
payObj.SetOrderID(orderID)
payObj.SetOrderDate(orderDate)

payObj.SetTagValue "1001", transactionId
payObj.SetTagValue "0012", authAmount

payObj.Run(RUN_MODE)		

payObj.GetTagValue "1002", responseCode
payObj.GetTagValue "1003", responseMessage
payObj.GetTagValue "1001", outTRANS
payObj.GetTagValue "1009", detailResponseCode
payObj.GetTagValue "1010", detailResponseMessage

set payObj = Nothing
%>
<html>
<head>
<title>신용카드 취소 요청/응답</title>
<meta http-equiv="Content-Type" content="text/html; charset=euc-kr">
<link href="css/css_admin.css" rel="stylesheet" type="text/css">
<link href="css/css_01.css" rel="stylesheet" type="text/css">
<head>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">
<table width="500" border="0" cellpadding="0"	cellspacing="0">
	<tr> 
	  <td height="25" style="padding-left:10px" class="title01">신용카드 &gt; <b>취소 요청 응답</b></td>
	</tr>
	<tr>
		<td>&nbsp;</td>
	</tr>
	<tr>
		<td align="center"><!--본문테이블 시작--->
		<table width="450" border="0" cellpadding="4" cellspacing="1" bgcolor="#B0B0B0">
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>가맹점 아이디</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;<b><%=serviceId%></b></td>
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>주문번호</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;<b><%=orderId%></b></td>
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>주문일시</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;<b><%=orderDate%></b></td>
			</tr>			
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>거래번호</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;<b><%=outTRANS%></b></td>
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>응답코드</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;<b><%=responseCode%></b></td>
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>응답메시지</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;<b><%=responseMessage%></b></td>
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>상세응답코드</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;<b><%=detailResponseCode%></b></td>
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>상세응답메시지</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;<b><%=detailResponseMessage%></b></td>
			</tr>
		</table>
		</td>
	</tr>
</table>
</body>
</html>

