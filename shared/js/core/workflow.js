export const WORKFLOW_VERSION = 2;

export const WORKFLOW_STATES = Object.freeze({
  BOOKING_REQUEST_RECEIVED: {order:1, owner:'organization', label:'Booking Request Received', ec:'Review the new booking request and send the Event Form.', client:'Your booking request was received.', nextAction:'Send Event Form'},
  EVENT_FORM_PENDING: {order:2, owner:'client', label:'Event Form Pending', ec:'Waiting for the client to complete the Event Form.', client:'Complete and submit your Event Form.', nextAction:'Submit Event Form'},
  QUOTE_PREPARATION: {order:3, owner:'organization', label:'Quote Preparation', ec:'Prepare the detailed final quote from the Event Form.', client:'Your final quote is being prepared.', nextAction:'Send Final Quote'},
  QUOTE_REVIEW: {order:4, owner:'client', label:'Quote Review', ec:'Waiting for the client to review the final quote.', client:'Review and accept or decline the final quote.', nextAction:'Review Final Quote'},
  CONTRACT_PREPARATION: {order:5, owner:'organization', label:'Contract Preparation', ec:'Prepare and send the contract and deposit request.', client:'Your contract and deposit request are being prepared.', nextAction:'Send Contract & Deposit'},
  CONTRACT_DEPOSIT_PENDING: {order:6, owner:'client', label:'Contract & Deposit Pending', ec:'Waiting for contract signature and deposit payment.', client:'Sign the contract and pay the deposit to lock in the date.', nextAction:'Sign Contract & Pay Deposit'},
  PLANNING_FORM_PREPARATION: {order:7, owner:'organization', label:'Planning Form Preparation', ec:'Send the Event Detail Planning Form.', client:'Your detailed planning form is being prepared.', nextAction:'Send Planning Form'},
  PLANNING_FORM_PENDING: {order:8, owner:'client', label:'Event Planning Pending', ec:'Waiting for the client to complete event details and music choices.', client:'Complete and submit your Event Detail Planning Form.', nextAction:'Submit Planning Form'},
  PLANNING_REVIEW: {order:9, owner:'organization', label:'Planning Review', ec:'Review the submitted event details and planning information.', client:'Your event details are being reviewed.', nextAction:'Approve Planning'},
  EVENT_READY: {order:10, owner:'organization', label:'Event Ready', ec:'The contracted event is ready for final operations.', client:'Your event planning is complete and ready.', nextAction:'Mark Event Completed'},
  EVENT_COMPLETED: {order:11, owner:'organization', label:'Event Completed', ec:'The event has been delivered. Confirm the final invoice and payment.', client:'Your event has been completed. Thank you!', nextAction:'Request Final Payment'},
  FINAL_PAYMENT_PENDING: {order:12, owner:'organization', label:'Final Payment Pending', ec:'Waiting for the remaining balance to be verified.', client:'Your remaining balance is due.', nextAction:'Verify Final Payment'},
  PAID_COMPLETED: {order:13, owner:'organization', label:'Paid & Completed', ec:'The event is complete and fully paid.', client:'Your event is complete and paid in full.', nextAction:'Archive Event'},
  ARCHIVED: {order:14, owner:'none', label:'Archived', ec:'The event workflow is closed.', client:'This event is archived.', nextAction:'Closed'},
  DECLINED: {order:99, owner:'none', label:'Quote Declined', ec:'The client declined the quote.', client:'The quote was declined.', nextAction:'Closed'}
});

const TRANSITIONS = Object.freeze({
  BOOKING_REQUEST_RECEIVED: {send_event_form:'EVENT_FORM_PENDING'},
  EVENT_FORM_PENDING: {submit_event_form:'QUOTE_PREPARATION'},
  QUOTE_PREPARATION: {send_quote:'QUOTE_REVIEW'},
  QUOTE_REVIEW: {accept_quote:'CONTRACT_PREPARATION', decline_quote:'DECLINED'},
  CONTRACT_PREPARATION: {send_contract_deposit:'CONTRACT_DEPOSIT_PENDING'},
  PLANNING_FORM_PREPARATION: {send_planning_form:'PLANNING_FORM_PENDING'},
  PLANNING_FORM_PENDING: {submit_planning_form:'PLANNING_REVIEW'},
  PLANNING_REVIEW: {approve_planning:'EVENT_READY', return_planning:'PLANNING_FORM_PENDING'},
  EVENT_READY: {complete_event:'EVENT_COMPLETED'},
  EVENT_COMPLETED: {request_final_payment:'FINAL_PAYMENT_PENDING'},
  FINAL_PAYMENT_PENDING: {record_final_payment:'PAID_COMPLETED'},
  PAID_COMPLETED: {archive_event:'ARCHIVED'}
});

export function createWorkflow(actor='organization'){
  const now=new Date().toISOString();
  return {version:WORKFLOW_VERSION,currentState:'BOOKING_REQUEST_RECEIVED',owner:'organization',enteredAt:now,updatedAt:now,contractSigned:false,depositPaid:false,history:[{id:crypto.randomUUID(),from:null,to:'BOOKING_REQUEST_RECEIVED',action:'booking_request_received',actor,at:now}]};
}

export function ensureWorkflow(eventState){
  if(!eventState.workflow||!WORKFLOW_STATES[eventState.workflow.currentState]) eventState.workflow=createWorkflow();
  eventState.workflow.version=WORKFLOW_VERSION;
  eventState.workflow.history=Array.isArray(eventState.workflow.history)?eventState.workflow.history:[];
  syncOwner(eventState.workflow);
  return eventState.workflow;
}

function syncOwner(workflow){workflow.owner=WORKFLOW_STATES[workflow.currentState]?.owner||'none'}
export function getWorkflowState(eventState){const workflow=ensureWorkflow(eventState);return {...WORKFLOW_STATES[workflow.currentState],id:workflow.currentState,workflow}}
export function allowedActions(eventState,actor){
  const workflow=ensureWorkflow(eventState);
  if(workflow.currentState==='CONTRACT_DEPOSIT_PENDING'){
    const actions=[];
    if(actor==='client'&&!workflow.contractSigned)actions.push('sign_contract');
    if(actor==='client'&&!workflow.depositPaid)actions.push('pay_deposit');
    return actions;
  }
  const state=WORKFLOW_STATES[workflow.currentState];
  if(!state||!(state.owner===actor||state.owner==='both'))return [];
  return Object.keys(TRANSITIONS[workflow.currentState]||{});
}

export function transitionWorkflow(eventState,action,actor){
  const workflow=ensureWorkflow(eventState);
  const allowed=allowedActions(eventState,actor);
  if(!allowed.includes(action))return {ok:false,error:`Action ${action} is not allowed for ${actor} during ${workflow.currentState}.`};
  const now=new Date().toISOString();
  const from=workflow.currentState;
  if(from==='CONTRACT_DEPOSIT_PENDING'){
    if(action==='sign_contract')workflow.contractSigned=true;
    if(action==='pay_deposit')workflow.depositPaid=true;
    workflow.history.push({id:crypto.randomUUID(),from,to:from,action,actor,at:now});
    if(workflow.contractSigned&&workflow.depositPaid){
      workflow.currentState='PLANNING_FORM_PREPARATION';
      workflow.enteredAt=now;
      workflow.history.push({id:crypto.randomUUID(),from,to:'PLANNING_FORM_PREPARATION',action:'contract_and_deposit_complete',actor:'system',at:now});
    }
  }else{
    const to=TRANSITIONS[from]?.[action];
    if(!to)return {ok:false,error:'No valid workflow transition was found.'};
    workflow.currentState=to;
    workflow.enteredAt=now;
    workflow.history.push({id:crypto.randomUUID(),from,to,action,actor,at:now});
  }
  workflow.updatedAt=now;
  syncOwner(workflow);
  return {ok:true,workflow};
}

export function workflowProgress(eventState){
  const state=getWorkflowState(eventState);
  if(state.id==='DECLINED')return 0;
  return Math.round(((Math.min(state.order,14)-1)/(14-1))*100);
}

export const ACTION_LABELS=Object.freeze({
  send_event_form:'Send Event Form',submit_event_form:'Submit Event Form',send_quote:'Send Final Quote',accept_quote:'Accept Quote',decline_quote:'Decline Quote',send_contract_deposit:'Send Contract & Deposit',sign_contract:'Sign Contract',pay_deposit:'Record Deposit Paid',send_planning_form:'Send Planning Form',submit_planning_form:'Submit Planning Form',approve_planning:'Approve Planning',return_planning:'Return for Changes',complete_event:'Mark Event Completed',request_final_payment:'Request Final Payment',record_final_payment:'Verify Final Payment',archive_event:'Archive Event'
});
