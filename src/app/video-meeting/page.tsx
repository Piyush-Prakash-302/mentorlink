"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

function VideoMeetingContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const meetingRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meetingInfo, setMeetingInfo] = useState<any>(null);

  useEffect(() => {
    async function loadMeeting() {
      if (!userId) {
        setError("Meeting user not found.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `/api/video-meeting?userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!data.success) {
          setError(data.message || "Unable to start meeting.");
          setLoading(false);
          return;
        }

        setMeetingInfo(data);

        if (!window.JitsiMeetExternalAPI) {
          const script = document.createElement("script");

          script.src = "https://meet.jit.si/external_api.js";
          script.async = true;

          script.onload = () => {
            startMeeting(data);
          };

          script.onerror = () => {
            setError("Video meeting service could not be loaded.");
            setLoading(false);
          };

          document.body.appendChild(script);
        } else {
          startMeeting(data);
        }
      } catch {
        setError("Unable to start video meeting.");
        setLoading(false);
      }
    }

    function startMeeting(data: any) {
      if (!meetingRef.current || !window.JitsiMeetExternalAPI) {
        return;
      }

      jitsiRef.current = new window.JitsiMeetExternalAPI(
        "meet.jit.si",
        {
          roomName: data.roomName,
          parentNode: meetingRef.current,
          width: "100%",
          height: 650,
          userInfo: {
            displayName: data.currentUser.name,
          },
          configOverwrite: {
            prejoinPageEnabled: true,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
          },
        }
      );

      setLoading(false);
    }

    loadMeeting();

    return () => {
      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }
    };
  }, [userId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-red-600 mb-3">
            Meeting Unavailable
          </h1>

          <p className="text-gray-600">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-2xl font-bold">
          MentorLink Video Meeting
        </h1>

        {meetingInfo && (
          <p className="text-gray-500 mt-1">
            {meetingInfo.currentUser.name}
            {"  "}with{"  "}
            {meetingInfo.otherUser.name}
          </p>
        )}
      </div>

      <main className="p-4">
        {loading && (
          <div className="bg-white rounded-xl shadow p-6 text-center mb-4">
            <p className="text-gray-500">
              Starting video meeting...
            </p>
          </div>
        )}

        <div
          ref={meetingRef}
          className="max-w-7xl mx-auto bg-black rounded-xl overflow-hidden shadow"
        />
      </main>
    </div>
  );
}
export default function VideoMeetingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
          <p className="text-gray-500">
            Loading video meeting...
          </p>
        </div>
      }
    >
      <VideoMeetingContent />
    </Suspense>
  );
}
