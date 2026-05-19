<%@ page contentType="text/html; charset=euc-kr" %>
<%@ page import="com.galaxia.api.*"%>
<%@include file="process_callback.jsp" %>
<%
	String serviceId = null;
	String orderId = null;
	String orderDate = null;
	String transactionId = null;
	String responseCode = null;
	String responseMessage = null;
	String detailResponseCode = null;
	String detailResponseMessage = null;

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
		
		//취소 요청 파라메터
		serviceId = "M2103140" ; //콜백방식용 테스트 아이디 : M2103140
		orderDate = year + month + date + hour + minute + second ; //취소 요청일시
		orderId = "cancel_" + orderDate ;  //취소 요청번호
		transactionId = "2016051316TT005955";			// 취소 대상건의 거래번호

		//결제 정보 session에 저장
		session.setAttribute("serviceId", serviceId);
		session.setAttribute("orderId", orderId);
		session.setAttribute("orderDate", orderDate);
		session.setAttribute("transactionId", transactionId);

		Message respMsg = cancelProcess(session, config);
    
  		session.setAttribute("responseMessage", respMsg);
  
		//취소요청에 대한 응답 결과 설정
		responseCode = respMsg.get(MessageTag.RESPONSE_CODE);
		responseMessage = respMsg.get(MessageTag.RESPONSE_MESSAGE);
		detailResponseCode = respMsg.get(MessageTag.DETAIL_RESPONSE_CODE);
		detailResponseMessage = respMsg.get(MessageTag.DETAIL_RESPONSE_MESSAGE);
		transactionId = respMsg.get(MessageTag.TRANSACTION_ID);
%>
<html>
<head>
<title></title>
<meta http-equiv="Content-Type" content="text/html; charset=euc-kr">
<link href="css/css_admin.css" rel="stylesheet" type="text/css">
<link href="css/css_01.css" rel="stylesheet" type="text/css">
<head>
<!-- 키 방어 코드 -->
<script type="text/javascript" src="js/comm.js"></script>
</head>
<body leftmargin="0" topmargin="0" marginwidth="0" marginheight="0">	
<table width="500" border="0" cellpadding="0"	cellspacing="0">
	<tr> 
	  <td height="25" style="padding-left:10px" class="title01">카드결제 &gt; <b>가맹점 Return Url</b></td>
	</tr>
	<!--title-->
	<tr>
		<td height="54" background="images/manager_title01.gif" style="padding-left: 65px; padding-top: 18px"><font size="3"><strong>가맹점 Return Url</strong></font></td>
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
				<td align="left" bgcolor="#FFFFFF">&nbsp;<b><%=transactionId%></b></td>								
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
<%
	} catch (Exception ex) {
		ex.printStackTrace();
%>
<script type="text/javascript">
	alert("에러 코드 : 0901\n에러 메시지 : 취소요청창(cancel)! 관리자에게 문의 하세요!");
	window.close();
	</script>
<%
	}
%>