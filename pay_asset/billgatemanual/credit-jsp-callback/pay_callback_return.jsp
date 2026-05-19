<%@ page contentType="text/html; charset=euc-kr" %>

<%@ page import="com.galaxia.api.*"%>
<%@ page import="com.galaxia.api.merchant.* "%>
<%@ page import="com.galaxia.api.crypto.* "%> 

<%@include file="process_callback.jsp" %>

<%
//---------------------------------------------------------------------------------------------------------------
// 가맹점 결과 처리 페이지 -- 수정 불가
//---------------------------------------------------------------------------------------------------------------
String serviceId = null ;
String serviceCode = null ;
String orderId = null ;
String orderDate = null ;
String transactionId = null ;
String message = null ;
String responseCode = null ;
String responseMessage = null ;
String detailResponseCode = null ;
String detailResponseMessage = null ;
String authAmount = null ; 
String authNumber = null ; 
String authDate = null ;
String taxAmount = null;
String taxFreeAmount = null;

try{
	request.setCharacterEncoding("euc-kr");
	
	//만료된 페이지 설정
	response.setHeader("cache-control", "no-cache");
	response.setHeader("pragma", "no-cache"); 
	response.setHeader("expire", "0");
	
	//인증결과 받아오기
	serviceId = request.getParameter("SERVICE_ID");
	orderId = request.getParameter("ORDER_ID");
	orderDate = request.getParameter("ORDER_DATE");
	message = request.getParameter("MESSAGE");
	transactionId = request.getParameter("TRANSACTION_ID");	

	//인증결과 session에 저장
	session.setAttribute("serviceId", serviceId);
	session.setAttribute("message", message);
	session.setAttribute("taxAmount", taxAmount);// 과세금액 추가시에만 요청
	session.setAttribute("taxFreeAmount", taxFreeAmount);// 면세금액 추가시에만 요청
			
	//승인요청
	Message respMsg = linkAuthProcess(session, config);

	//승인요청에 대한 응답 결과 설정
	serviceCode = respMsg.getServiceCode();		
	responseCode = respMsg.get(MessageTag.RESPONSE_CODE);
	responseMessage = respMsg.get(MessageTag.RESPONSE_MESSAGE);
	detailResponseCode = respMsg.get(MessageTag.DETAIL_RESPONSE_CODE);
	detailResponseMessage = respMsg.get(MessageTag.DETAIL_RESPONSE_MESSAGE);
	transactionId = respMsg.get(MessageTag.TRANSACTION_ID);
	 
	//승인 성공인 경우 승인번호/승인일시 처리
	if(responseCode.equals("0000")) {
		authAmount = respMsg.get(MessageTag.AUTH_AMOUNT);
		authNumber = respMsg.get(MessageTag.AUTH_NUMBER);
		authDate = respMsg.get(MessageTag.AUTH_DATE);
	}

 
//---------------------------------------------------------------------------------------------------------------
// 가맹점 결과 처리 페이지 -- 수정 불가 끝
//---------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------
// 가맹점 수정 부분 : 결제 성공 시 가맹점 처리 부분 시작
//---------------------------------------------------------------------------------------------------------------
  if(responseCode.equals("0000")) {
	  
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
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">	
<table width="500" border="0" cellpadding="0"	cellspacing="0">
	<tr> 
	  <td height="25" style="padding-left:10px" class="title01"> 
		# 현재위치 &gt;&gt; 신용카드 &gt; <b>가맹점 Return Url</b></td>
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
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>승인번호</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=authNumber%></b>
				</td>								
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>승인일시</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=authDate%></b>
				</td>								
			</tr>
			<tr>
				<td width="100" align="center" bgcolor="#F6F6F6"><b>승인금액</b></td>
				<td width="200" align="left" bgcolor="#FFFFFF">&nbsp; 
					<b><%=authAmount%></b>
				</td>								
			</tr>
		</table>
		</td>
	</tr>
</table>
</body>
</html>
<%
//---------------------------------------------------------------------------------------------------------------
// 가맹점 수정 부분 : 결제 성공 시 가맹점 처리 부분 끝
//---------------------------------------------------------------------------------------------------------------
  }
	else {
//---------------------------------------------------------------------------------------------------------------
// 가맹점 수정 부분 : 결제 실패 시  가맹점 처리 부분 시작
//---------------------------------------------------------------------------------------------------------------
%>
<html>
<head>
<title></title>
<meta http-equiv="Content-Type" content="text/html; charset=euc-kr">
<link href="css/css_admin.css" rel="stylesheet" type="text/css">
<link href="css/css_01.css" rel="stylesheet" type="text/css">
<head>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">
<form name="payment" method="post" action="idQueryProcess.jsp">
<table width="500" border="0" cellpadding="0"	cellspacing="0">
	<tr> 
	  <td height="25" background="images/top_bg02.gif" style="padding-left:10px" class="title01"><img src="images/top_icon01.gif"> 
		현재위치 &gt;&gt; 신용카드 &gt; <b>가맹점 Return Url</b></td>
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
					<b><%=serviceId%></b>
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
</form>
</body>
</html>
<%
//---------------------------------------------------------------------------------------------------------------
// 가맹점 수정 부분 : 결제 실패 시  가맹점 처리 끝 
//---------------------------------------------------------------------------------------------------------------
	}
}
catch(Exception ex) {
	ex.printStackTrace();
%>
	<script type="text/javascript">
	alert("에러 코드 : 0902\n에러 메시지 : 가맹점 승인요청 결과(return)! 관리자에게 문의 하세요!");
	window.close();
	</script>
<%
}
%>