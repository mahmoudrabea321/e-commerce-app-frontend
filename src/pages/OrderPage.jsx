import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

function OrderPage() {
  const { id } = useParams();
  const [paypalClientId, setPaypalClientId] = useState(null);

  useEffect(() => {
    const fetchPaypalClientId = async () => {
      try {
        const res = await fetch("/api/keys/paypal");
        const data = await res.json();
        setPaypalClientId(data.clientId);
      } catch (err) {
        console.error("Error fetching PayPal Client ID:", err);
      }
    };

    fetchPaypalClientId();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Order #{id}</h2>

      {paypalClientId ? (
        <PayPalScriptProvider options={{ "client-id": paypalClientId }}>
          <PayPalButtons
            createOrder={(data, actions) => {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: "100.00", 
                    },
                  },
                ],
              });
            }}
            onApprove={async (data, actions) => {
              const details = await actions.order.capture();
              alert("Payment successful! Thank you, " + details.payer.name.given_name);
            }}
            onError={(err) => {
              console.error("PayPal Checkout Error:", err);
              alert("Payment failed. Please try again.");
            }}
          />
        </PayPalScriptProvider>
      ) : (
        <p>Loading payment options...</p>
      )}
    </div>
  );
}

export default OrderPage;
