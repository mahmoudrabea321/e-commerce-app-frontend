import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ShippingPage.css"; 

const ProfilePage = () => {
  const navigate = useNavigate();

  const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

  const [name, setName] = useState(userInfo?.name || "");
  const [email, setEmail] = useState(userInfo?.email || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); 
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("❌ Passwords do not match");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.put(
        "/api/users/profile",
        { name, email, password },
        {
          headers: {
            Authorization: `Bearer ${userInfo?.token}`,
          },
        }
      );

      localStorage.setItem("userInfo", JSON.stringify(data));
      setMessage("✅ Profile updated successfully!");
      setMessageType("success");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch {
      setMessage("❌ Failed to update profile");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shipping-container">
      <form className="shipping-form" onSubmit={submitHandler}>
        <h2>👤 Profile Page</h2>

        {message && (
          <div className={messageType === "success" ? "success-message" : "error-message"}>
            {message}
          </div>
        )}

        <div className="form-group">
          <label>Username</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>

        <div className="form-group">
          <label>Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update"}
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
