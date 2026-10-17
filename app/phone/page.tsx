"use client";

import { usePhoneCall } from "@/hooks/usePhoneCall";
import { usePhoneDevice } from "@/hooks/usePhoneDevice";
import { DeviceFrame } from "@/components/phone/device/DeviceFrame";
import { HomeScreen } from "@/components/phone/device/HomeScreen";
import { PhoneApp } from "@/components/phone/phone-app/PhoneApp";
import { CallScreen } from "@/components/phone/call/CallScreen";
import { IncomingCallScreen } from "@/components/phone/call/IncomingCallScreen";
import { CallEndedScreen } from "@/components/phone/call/CallEndedScreen";
import { TicketScreen } from "@/components/phone/TicketScreen";
import { TicketLookupScreen } from "@/components/phone/TicketLookupScreen";
import {
  DEMO_CALLER_LABEL,
  DEMO_NUMBER,
  DEMO_NUMBER_DISPLAY,
} from "@/lib/phone/demo";

type StatusTone = "light" | "dark";

export default function PhonePage() {
  const call = usePhoneCall();
  const device = usePhoneDevice(call);

  const atDevice = call.screen === "idle";

  const backHome = (): void => {
    call.goIdle();
    device.goHome();
  };

  let statusTone: StatusTone = "light";
  if (atDevice) {
    statusTone = device.view === "home" ? "light" : "dark";
  } else if (call.screen === "lookup") {
    statusTone = "dark";
  }
  // Call, ticket and ended screens all open on a dark forest surface, so the
  // light status-bar treatment carries over.

  return (
    <DeviceFrame statusTone={statusTone}>
      {atDevice && device.view === "home" ? (
        <HomeScreen
          onOpenPhone={device.openPhone}
          onOpenSaathi={call.goLookup}
          onNotice={device.notify}
        />
      ) : null}

      {atDevice && device.view === "phone" ? (
        <PhoneApp
          tab={device.tab}
          dialed={device.dialed}
          numberError={device.numberError}
          recents={device.recents}
          onSelectTab={device.setTab}
          onKey={device.pressKey}
          onBackspace={device.backspace}
          onCall={device.placeCall}
          onCallContact={device.callContact}
          onHome={device.goHome}
        />
      ) : null}

      {call.screen === "call" &&
      call.callPhase === "ringing" &&
      call.direction === "incoming" ? (
        <IncomingCallScreen
          label={DEMO_CALLER_LABEL}
          number={DEMO_NUMBER_DISPLAY}
          onAccept={call.answer}
          onDecline={call.declineCall}
        />
      ) : null}

      {call.screen === "call" &&
      (call.callPhase === "dialing" || call.callPhase === "in_call") ? (
        <CallScreen
          callPhase={call.callPhase}
          turnStatus={call.turnStatus}
          messages={call.messages}
          liveTranscript={call.liveTranscript}
          error={call.error}
          recognitionSupported={call.recognitionSupported}
          speaker={call.speaker}
          muted={call.muted}
          elapsedMs={call.elapsedMs}
          label={DEMO_CALLER_LABEL}
          number={DEMO_NUMBER}
          onEnd={call.endCall}
          onListen={call.listen}
          onStopListening={call.stopListening}
          onRetry={call.retry}
          onSendText={call.sendText}
          onToggleMute={call.toggleMute}
          onToggleSpeaker={call.toggleSpeaker}
        />
      ) : null}

      {call.screen === "ended" ? (
        <CallEndedScreen
          endedCall={call.endedCall}
          onViewCase={call.showTicket}
          onHome={backHome}
        />
      ) : null}

      {call.screen === "ticket" && call.activeCase ? (
        <TicketScreen
          item={call.activeCase}
          variant={call.ticketVariant}
          language="en-IN"
          onHome={backHome}
          onFollowUp={call.startFollowUp}
        />
      ) : null}

      {call.screen === "lookup" ? (
        <TicketLookupScreen
          language="en-IN"
          busy={call.lookupBusy}
          error={call.lookupError}
          onLookup={call.lookup}
          onBack={backHome}
        />
      ) : null}

      {device.notice && atDevice ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-40 flex justify-center px-6">
          <button
            type="button"
            onClick={device.dismissNotice}
            className="pointer-events-auto rounded-full bg-ink/90 px-4 py-2 text-sm font-medium text-ivory shadow-lift"
          >
            {device.notice}
          </button>
        </div>
      ) : null}
    </DeviceFrame>
  );
}
