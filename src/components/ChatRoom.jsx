import { useState, useEffect, useRef } from "react";
import { auth, loginWithGoogle, logout, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
  limit,
} from "firebase/firestore";

export default function ChatRoom() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [currentRoom, setCurrentRoom] = useState("general");
  const [rooms, setRooms] = useState(["general", "tech", "random"]);

  const bottomRef = useRef(null);
  const isFirstLoad = useRef(true);
  const prevMessageLength = useRef(0);

  /* ================= AUTH LISTENER ================= */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  /* ================= FIRESTORE REALTIME ================= */
  useEffect(() => {
    if (!currentRoom) return;

    const q = query(
      collection(db, "messages"),
      where("roomId", "==", currentRoom),
      orderBy("createdAt", "asc"),
      limit(100)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // fallback sort kalau serverTimestamp belum ada
        data.sort(
          (a, b) =>
            (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
        );

        setMessages(data);
      },
      (err) => console.error("Firestore error:", err)
    );

    return () => unsub();
  }, [currentRoom]);

  /* ================= AUTO SCROLL (FIXED) ================= */
  useEffect(() => {
    // ⛔ Jangan scroll saat first load
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      prevMessageLength.current = messages.length;
      return;
    }

    // ✅ Scroll hanya kalau pesan bertambah
    if (messages.length > prevMessageLength.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: message.trim(),
        uid: user.uid,
        displayName: user.displayName || "Anonymous",
        photoURL: user.photoURL || "",
        roomId: currentRoom,
        createdAt: serverTimestamp(),
      });
      setMessage("");
    } catch (err) {
      console.error("Gagal kirim pesan:", err);
    }
  };

  return (
    <div className="bg-zinc-900 border border-gray-700 p-6 rounded-xl shadow-lg max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4 text-white">
        💬 Chat Room
      </h2>

      {/* ================= ROOM SELECT ================= */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <select
          value={currentRoom}
          onChange={(e) => setCurrentRoom(e.target.value)}
          className="bg-zinc-700 text-white p-2 rounded"
        >
          {rooms.map((room) => (
            <option key={room}>{room}</option>
          ))}
        </select>

        <button
          onClick={() => {
            const newRoom = prompt("Nama room:");
            if (newRoom && !rooms.includes(newRoom)) {
              setRooms((prev) => [...prev, newRoom]);
              setCurrentRoom(newRoom);
            }
          }}
          className="bg-blue-600 px-3 py-2 rounded text-white hover:bg-blue-700"
        >
          + Room
        </button>
      </div>

      {/* ================= USER HEADER ================= */}
      {user && (
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL}
              className="w-10 h-10 rounded-full"
              alt="avatar"
            />
            <span className="text-white font-semibold">
              {user.displayName}
            </span>
          </div>
          <button
            onClick={logout}
            className="bg-red-600 px-4 py-1 rounded-full text-white"
          >
            Logout
          </button>
        </div>
      )}

      {/* ================= CHAT MESSAGE ================= */}
      <div className="h-72 overflow-y-auto bg-zinc-800 p-3 rounded-lg space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.uid === user?.uid ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-[70%] ${
                msg.uid === user?.uid
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              <div className="text-xs opacity-70 mb-1">
                {msg.displayName}
              </div>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* ================= INPUT ================= */}
      {user ? (
        <form onSubmit={sendMessage} className="flex gap-2 mt-3">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 p-2 rounded bg-zinc-700 text-white outline-none"
          />
          <button className="bg-green-600 px-4 rounded text-white">
            Send
          </button>
        </form>
      ) : (
        <button
          onClick={loginWithGoogle}
          className="mt-4 bg-white px-5 py-2 rounded-full w-full"
        >
          Login with Google
        </button>
      )}
    </div>
  );
}
