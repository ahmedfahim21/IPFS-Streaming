# Decentralized IPFS Streaming Platform

## Mentors:
- Fahim Ahmed
- Vedant Tarale
- Abhishek Satpathy

## Mentees:
- Nandan Ramesh
- Krishna Tulsyan
- Upasana Nayak

## Aim:
The aim of our project is to leverage IPFS to create a streaming platform that enhances web speed, safety, and openness, while also implementing adaptive bitrate streaming for improved user experience.

## Introduction:
Traditional streaming methods relying on HTTP and TCP protocols face challenges like bandwidth limitations and scalability issues. This project proposes to overcome these challenges by utilizing the decentralized, peer-to-peer approach of IPFS for media streaming, aiming for smoother playback experiences and reduced strain on servers.

### Diagrammatic Representation:
![image2](https://github.com/ahmedfahim21/IPFS-Streaming/assets/122672121/b095133f-246e-410b-b168-21f198de08c0)


## Methodology:
### Concept:
With IPFS, content can be fetched from nearby peers, reducing the distance data has to travel. This can significantly reduce buffering and latency issues, resulting in a smoother streaming experience for viewers, even for high-quality videos. In traditional HTTP streaming, each viewer needs to individually download the content from the server, resulting in multiple copies being transmitted over the network (when multiple users are requesting the same video). IPFS utilizes content-addressable storage, where content is identified by its unique hash. This enables the sharing of content among viewers, reducing bandwidth requirements as the same content can be fetched from nearby peers.

Additionally, IPFS's peer-to-peer nature allows for better scalability compared to centralized streaming systems. As the number of viewers increases, the content distribution load is distributed among multiple peers, reducing strain on individual servers. One of the key benefits of IPFS Streaming is that it makes it possible to stream content from IPFS without relying on a centralized server or content delivery network (CDN). Instead, content is streamed directly from other users on the IPFS network who have already downloaded the file. This makes IPFS Streaming a highly decentralized and peer-to-peer technology.

### Implementation:
1. **Research and Planning**: Gain understanding of Web, Computer Networking, FFmpeg, HLS, and IPFS technology. Analyze IPFS capabilities for streaming and define system architecture.
2. **FFmpeg Video Chunking**: Use FFmpeg to chunk the video file into several .ts files, each containing a video segment (of length 10 seconds) and generate .m3u8 files for each of the 4 resolutions.
3. **Uploading files**: Upload the entire folder containing the .m3u8 files for each resolution and their corresponding .ts files for the entire video length to IPFS.
4. **Streaming videos**: Viewers send requests to the Node server to watch the videos, which then respond with the IPFS CID (Content IDentifier) of the folder containing files pertaining to that video. The client retrieves the file directly from the IPFS network using the CID, while caching it in the browser’s local storage.
5. **Adaptive bitrate**: During the streaming process, if the user sets their quality to “Auto”, then depending on the network speed of the client, the player shifts between resolutions to give the user a better experience.

## Results:
In this project, we successfully developed a decentralized streaming platform leveraging IPFS, which allows users to upload, browse, and stream videos with improved efficiency and scalability. Dynamic adaptive bitrate streaming based on network conditions was also implemented, thereby enhancing the overall streaming experience.

### Screenshots:
Home Screen
![image4](https://github.com/ahmedfahim21/IPFS-Streaming/assets/122672121/2867f5be-8ce5-4a3c-8caf-50fe63229751)


Video Player
![image3](https://github.com/ahmedfahim21/IPFS-Streaming/assets/122672121/3e252be5-b916-4c93-badd-06b0754b718e)


Adaptive Bit Rate 
![image1](https://github.com/ahmedfahim21/IPFS-Streaming/assets/122672121/5cad0965-d11b-4f70-ae86-a7a1797cf392)


## Conclusions:
IPFS offers advantages over traditional HTTP streaming, such as reduced buffering and latency, scalability, and decentralized content distribution. The project demonstrates the feasibility of utilizing IPFS for building efficient and scalable streaming platforms, with potential for further enhancements such as smart contract integration and live streaming support.

## References:
- [IPFS Documentation](https://docs.ipfs.io/)
- [Streaming Over IPFS](https://medium.com/@jessgreb01/what-is-ipfs-how-does-it-work-let-s-build-something-d0eb18c68b10)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [NodeJS Documentation](https://nodejs.org/en/docs/)
- [IPFS Video Streaming Blog](https://blog.goodaudience.com/building-a-peer-to-peer-video-streaming-app-with-ipfs-and-webrtc-b8f2d207ae5f)
- [How Video Streaming Works](https://www.sciencedirect.com/science/article/pii/S2212017313004417)
