# **How to Run / Correct the Project**

The frontend, backend, and database are fully deployed and accessible online:

### **Live Website**  
https://perfoevolution-frontend.onrender.com/

The only component that requires a setup is the **LLM (Llama 3.1 8B through Ollama)**.  
Since we haven't gotten the LLM choice decision from our client, here are two ways to enable the AI features:

- Running the model **locally**, or  
- Asking us to **host it temporarily** *(recommended)*.

---

## **Option A – Running the LLM on Your Machine**

This option only requires installing **Ollama**.  
It works best on a machine that has a **GPU**.

- **Using GPU** → ~30 seconds per AI response  
- **Using CPU** → 2 to 5 minutes per response *(very slow and inconsistent, performance varies widely)*  

If your computer does not support **GPU acceleration** with Ollama, **Option B is recommended**.

### **Install Ollama**
Download from:  
https://ollama.com/download

### **Pull and Run the Model**
```bash
ollama pull llama3.1:8b
ollama run llama3.1:8b
```

Keep this terminal window open while testing the website.

### **Verify that Ollama Is Using Your GPU**
```bash
ollama ps
```

**Expected output:**
```
NAME            SIZE      PROCESSOR
llama3.1:8b     4.7GB     GPU
```

If the PROCESSOR column shows **CPU**, then your machine is not using GPU acceleration and responses will be slow.

---

## **Option B – Using Our Hosted LLM (Recommended)**

We can run the LLM for you so you don’t have to install anything.

All AI calls from the deployed backend will be temporarily forwarded to **our computer**.

### **Why you must notify us before testing**

The LLM will run directly on our personal machine through a secure tunnel.  
We need to know approximately when you will test the website so that we can:

- Keep our machine powered on  
- Start Ollama with GPU  
- Start the tunneling service  
- Update the backend environment variable to route requests to our machine  
