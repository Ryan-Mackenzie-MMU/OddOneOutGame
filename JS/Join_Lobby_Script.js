document.getElementById("joinBtn").addEventListener("click", async () => {
  const username = document.getElementById("playerName").value.trim();

  if (!username) {
    alert("Enter a username");
    return;
  }

  try {
    const res = await fetch("/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username })
    });

    const data = await res.json();

    console.log("User created with ID:", data.userId);

    alert("User created! ID: " + data.userId);

  } catch (err) {
    console.error(err);
    alert("Error connecting to server");
  }
});