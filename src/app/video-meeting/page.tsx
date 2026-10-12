
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
  const meetingId = searchParams.get("meetingId");

  const meetingRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meetingInfo, setMeetingInfo] = useState<any>(null);

  useEffect(() => {
    let cancelled = false;
    let script: HTMLScriptElement | null = null;

    async function recordAttendance(action: "join" | "leave") {
      if (!meetingId) return;

      try {
        const res = await fetch("/api/meetings/attendance", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ meetingId, action }),
        });

        const result = await res.json();

        if (!res.ok || !result.success) {
          console.error("Attendance update failed:", result.message);
        }
      } catch (err) {
        console.error("Attendance request failed:", err);
      }
    }

    function startMeeting(data: any) {
      if (
        cancelled ||
        !meetingRef.current ||
        !window.JitsiMeetExternalAPI
      ) {
        return;
      }

      try {
        jitsiRef.current?.dispose();

        const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
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
        });

        jitsiRef.current = api;

        if (meetingId) {
          api.addEventListener("videoConferenceJoined", () => {
            void recordAttendance("join");
          });

          api.addEventListener("videoConferenceLeft", () => {
            void recordAttendance("leave");
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Jitsi initialization failed:", err);
        setError("Unable to start the video meeting.");
        setLoading(false);
      }
    }

    async function loadMeeting() {
      if (!meetingId && !userId) {
        setError("Meeting ID or user ID not found.");
        setLoading(false);
        return;
      }

      try {
        const params = meetingId
          ? `meetingId=${encodeURIComponent(meetingId)}`
          : `userId=${encodeURIComponent(userId!)}`;

        const res = await fetch(`/api/video-meeting?${params}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.success) {
          setError(data.message || "Unable to join meeting.");
          setLoading(false);
          return;
        }

        setMeetingInfo(data);

        if (window.JitsiMeetExternalAPI) {
          startMeeting(data);
          return;
        }

        script = document.querySelector<HTMLScriptElement>(
          'script[src="https://meet.jit.si/external_api.js"]'
        );

        if (!script) {
          script = document.createElement("script");
          script.src = "https://meet.jit.si/external_api.js";
          script.async = true;
          document.body.appendChild(script);
        }

        if (script.dataset.loaded === "true") {
          startMeeting(data);
        } else {
          script.addEventListener(
            "load",
            () => {
              script!.dataset.loaded = "true";
              startMeeting(data);
            },
            { once: true }
          );

          script.addEventListener(
            "error",
            () => {
              if (!cancelled) {
                setError("Video meeting service could not be loaded.");
                setLoading(false);
              }
            },
            { once: true }
          );
        }
      } catch {
        if (!cancelled) {
          setError("Unable to connect to the video meeting.");
          setLoading(false);
        }
      }
    }

    void loadMeeting();

    return () => {
      cancelled = true;

      if (jitsiRef.current) {
        jitsiRef.current.dispose();
        jitsiRef.current = null;
      }
    };
  }, [meetingId, userId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <h1 className="text-xl font-bold text-red-600 mb-3">
            Meeting Unavailable
          </h1>
          <p className="text-gray-600">{error}</p>
          <a
            href="/meeting"
            className="inline-block mt-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5"
          >
            Back to Meetings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-2xl font-bold">
          {meetingInfo?.meeting?.title || "MentorLink Video Meeting"}
        </h1>

        {meetingInfo && (
          <p className="text-gray-500 mt-1">
            {meetingInfo.currentUser.name}
            {" with "}
            {meetingInfo.otherUser.name}
          </p>
        )}

        {meetingInfo?.meeting && (
          <div className="mt-2 text-sm text-gray-600">
            <p>
              Scheduled:{" "}
              {new Date(meetingInfo.meeting.date).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}
            </p>
            <p>
              Duration: {meetingInfo.meeting.duration || 30} minutes
            </p>
          </div>
        )}
      </div>

      <main className="p-4">
        {loading && (
          <div className="bg-white rounded-xl shadow p-6 text-center mb-4">
            <p className="text-gray-500">Connecting to video meeting...</p>
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
          <p className="text-gray-500">Loading video meeting...</p>
        </div>
      }
    >
      <VideoMeetingContent />
    </Suspense>
  );
}
