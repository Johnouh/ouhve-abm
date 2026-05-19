<%@ page contentType="text/html; charset=euc-kr" %>
<%@ page import="java.util.* "%>
<%@ page import="java.sql.* "%>

<%@ page import="com.galaxia.api.* "%>
<%@ page import="com.galaxia.api.merchant.* "%>
<%@ page import="com.galaxia.api.crypto.* "%>
<%@ page import="com.galaxia.api.util.* "%>

<%!
	public static final String VERSION = "0100" ;	
	public static final String configLoad = "/credit-jsp-callback/WEB-INF/classes/config.ini";

	private GalaxiaCipher getCipher(String serviceId) throws Exception
	{
		GalaxiaCipher cipher = null ;
				
		String key = null ;
		String iv = null ;
    try { 
			ConfigInfo config = new ConfigInfo(configLoad , ServiceCode.CREDIT_CARD);
			key = config.getKey();
			iv = config.getIv();
			
			cipher = new Seed();
			cipher.setKey(key.getBytes());
			cipher.setIV(iv.getBytes());
    }
    catch(Exception e)
    {
    	throw e ;
    }	    
    return cipher;
	}
	
	//콜백URL SMS 전송요청
	public Message smsRequestProcess(HttpSession session, ServletConfig config) throws Exception
	{
		String serviceId 			= (String)session.getAttribute("serviceId");
		String orderId 				= (String)session.getAttribute("orderId");
		String orderDate 			= (String)session.getAttribute("orderDate");
		String userId 				= (String)session.getAttribute("userId");
		String userName 			= (String)session.getAttribute("userName");
		String itemCode 			= (String)session.getAttribute("itemCode");
		String itemName 			= (String)session.getAttribute("itemName");
		String userEmail 			= (String)session.getAttribute("userEmail");
		String userIp 				= (String)session.getAttribute("userIp");
		String dealAmount 			= (String)session.getAttribute("dealAmount");
		String vat 					= (String)session.getAttribute("vat");
		String serviceCharge		= (String)session.getAttribute("serviceCharge");
		String currency 			= (String)session.getAttribute("currency");
		String opcode 				= (String)session.getAttribute("opcode");
		String mobileNumber	 		= (String)session.getAttribute("mobileNumber");
		String returnUrl	 		= (String)session.getAttribute("returnUrl");

		Message requestMsg = new Message(VERSION, serviceId, 
			ServiceCode.CREDIT_CARD, 
			Command.ORDER_REQUEST, 
			orderId, 
			orderDate,
			getCipher(serviceId));
			
		Message	responseMsg = null;

		if(userId != null)				requestMsg.put(MessageTag.USER_ID, userId);
		if(userName != null)			requestMsg.put(MessageTag.USER_NAME, userName);
		if(itemCode != null) 			requestMsg.put(MessageTag.ITEM_CODE, itemCode);
		if(itemName != null)			requestMsg.put(MessageTag.ITEM_NAME, itemName);
		if(userEmail != null)			requestMsg.put(MessageTag.USER_EMAIL, userEmail);
		if(userIp != null)				requestMsg.put(MessageTag.USER_IP, userIp);
		if(dealAmount != null)			requestMsg.put(MessageTag.DEAL_AMOUNT, dealAmount);
		if(vat != null )				requestMsg.put(MessageTag.VAT, vat);
		if(serviceCharge != null)		requestMsg.put(MessageTag.SERVICE_CHARGE, serviceCharge);
		if(currency != null)			requestMsg.put(MessageTag.CURRENCY, currency);
		if(opcode != null)				requestMsg.put(MessageTag.OPCODE, opcode);
		if(mobileNumber != null)		requestMsg.put(MessageTag.MOBILE_NUMBER, mobileNumber);
		if(returnUrl != null)			requestMsg.put(MessageTag.RESULT, returnUrl);
		
		ServiceBroker sb = new ServiceBroker(configLoad , ServiceCode.CREDIT_CARD);
		responseMsg = sb.invoke(requestMsg);
		
		return responseMsg;
	}

	//승인요청
	public Message linkAuthProcess(HttpSession session, ServletConfig config) throws Exception 
	{
		String serviceId = (String)session.getAttribute("serviceId");
		String msg = (String)session.getAttribute("message");
		String taxAmount = (String)session.getAttribute("taxAmount");
		String taxFreeAmount = (String)session.getAttribute("taxFreeAmount");
		
		//메시지 Length 제거
		byte[] b = new byte[msg.getBytes().length - 4] ;
		System.arraycopy(msg.getBytes(), 4, b, 0, b.length);

		Message requestMsg = new Message(b, getCipher(serviceId)) ;
		
		Message responseMsg = null ;

		if(taxAmount != null) requestMsg.put(MessageTag.TAX_AMOUNT, taxAmount);
		if(taxFreeAmount != null) requestMsg.put(MessageTag.TAX_FREE_AMOUNT, taxFreeAmount);

		//ServiceBroker sb = new ServiceBroker(ServiceCode.CREDIT_CARD);
		ServiceBroker sb = new ServiceBroker(configLoad, ServiceCode.CREDIT_CARD);

		responseMsg = sb.invoke(requestMsg);
		
		return responseMsg;
	}

	//취소요청
		public Message cancelProcess(HttpSession session, ServletConfig config) throws Exception 
	{
		String serviceId = (String)session.getAttribute("serviceId");
		String orderId = (String)session.getAttribute("orderId");
		String orderDate = (String)session.getAttribute("orderDate");
		String transactionId = (String)session.getAttribute("transactionId");

		Message requestMsg = new Message(VERSION, serviceId, 
				ServiceCode.CREDIT_CARD, 
				Command.CANCEL_SMS_REQUEST,
				orderId, 
				orderDate, 
				getCipher(serviceId)) ;
		Message responseMsg = null ;
		
		if(transactionId != null) requestMsg.put(MessageTag.TRANSACTION_ID, transactionId);
				
		ServiceBroker sb = new ServiceBroker(configLoad , ServiceCode.CREDIT_CARD);

		responseMsg = sb.invoke(requestMsg);
		
		return responseMsg;
	}
%>

















