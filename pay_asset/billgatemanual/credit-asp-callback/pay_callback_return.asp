<!--#include file="include/ServiceConst.asp"-->
<%
	Response.Expires = -1
	Response.AddHeader"Pragma","no-cache"
	Response.CacheControl="no-cache"
	Response.ContentType ="text/html;charset=euc-kr"

	'변수 정의
	Dim SERVICE_ID, ORDER_DATE, ORDER_ID, MESSAGE, TRANSACTION_ID

	Dim payObj, result
	Dim RESPONSE_CODE, RESPONSE_MESSAGE, DETAIL_RESPONSE_CODE, DETAIL_RESPONSE_MESSAGE
	Dim OUT_TRANSACTION_ID, AUTH_NUMBER, AUTH_DATE, AUTH_AMOUNT

	'결제 정보 받아오기
	SERVICE_ID			= request.Form("SERVICE_ID")			'가맹점 ID
	ORDER_DATE			= request.Form("ORDER_DATE")			'주문일시
	ORDER_ID			= request.Form("ORDER_ID")				'주문번호
	MESSAGE				= request.Form("MESSAGE")				'암호화 메세지
	TRANSACTION_ID		= request.Form("TRANSACTION_ID")		'거래번호

	set payObj = server.CreateObject("GalaxiaApi.Pay")
	result = payObj.LoadConfig(DLL_PATH, SVCCODE_CREDIT_CARD, WORK_TYPE)

	if result < 0 Then
		response.write "에러 코드 : 0902\n에러 메시지 : 가맹점 승인요청 결과(설정파일 읽기 실패)! 관리자에게 문의 하세요!"
		response.end
	End If

	Dim MESSAGES
	MESSAGES = Right(MESSAGE, Len(MESSAGE)-4)

	payObj.SetCrypto(CRYPTO_MODE)						'암호화 모드
	payObj.SetMsg(MESSAGES)								'결제정보 메세지

	payObj.Run(RUN_MODE)								'0:테스트모드, 1:상용모드

	payObj.GetTagValue "1001", OUT_TRANSACTION_ID		'거래번호
	payObj.GetTagValue "1002", RESPONSE_CODE			'결과코드
	payObj.GetTagValue "1003", RESPONSE_MESSAGE			'결과메세지
	payObj.GetTagValue "1009", DETAIL_RESPONSE_CODE		'상세 결과코드
	payObj.GetTagValue "1010", DETAIL_RESPONSE_MESSAGE	'상세 결과메세지
	payObj.GetTagValue "1004", AUTH_NUMBER				'승인번호
	payObj.GetTagValue "1005", AUTH_DATE				'승인일시
	payObj.GetTagValue "1007", AUTH_AMOUNT				'승인금액

	set payObj = Nothing
%>
<html>
<head>
<title>신용카드 콜백 승인요청 결과</title>
<meta http-equiv="Content-Type" content="text/html; charset=euc-kr">
<link href="css/css_admin.css" rel="stylesheet" type="text/css">
<link href="css/css_01.css" rel="stylesheet" type="text/css">
<head>
<!-- 키 방어 코드 -->
<script type="text/javascript" src="./js/comm.js"></script>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">	
<table width="450" border="0" cellpadding="0"	cellspacing="0">
	<tr> 
	  <td height="25" background="images/top_bg02.gif" style="padding-left:10px" class="title01">신용카드 &gt; <b>콜백 승인요청 결과</b></td>
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
					<b><%=OUT_TRANSACTION_ID%></b>
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
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>승인번호</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=AUTH_NUMBER%></b>
				</td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>승인일시</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp;
					<b><%=AUTH_DATE%></b>
				</td>
			</tr>
			<tr>
				<td width="150" align="center" bgcolor="#F6F6F6"><b>승인금액</b></td>
				<td align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=AUTH_AMOUNT%></b>
				</td>
			</tr>
		</table>
		
		</td>
	</tr>
</table>
</body>
</html>