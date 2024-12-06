# Robot Network Web application  
It's hard to distribute just cli to work with devices, from the description and technical docs it's often hard to understand what exactly the tool does. I also expect that agents will be used by non-technical people, or just people who don't want to install any packages on their work machine. So I started working on the web gui.   It was decided to leave config customization only in the cli version for now, and to emphasize in development on custom functionality for launching and interacting with docker containers.  

 **Settings**  
The rpc node address, organization key and user key are set in the settings  
![Setings modal](https://i.ibb.co/N7bztzc/photo-2024-12-09-18-54-15.jpg)

**List robots**  
You can see the list of robots   
![List robots](https://i.ibb.co/XYFxy2Y/photo-2024-12-09-18-49-12.jpg)

**Add Job**  
In the web application, just like in cli, you can create new jobs, including template jobs.  
![Add Job](https://i.ibb.co/XSw5DVG/photo-2024-12-09-19-03-32.jpg)
**List Jobs**  
You can see a list of jobs that are working and completed (with a problematic date for now).  
![list jobs](https://i.ibb.co/kqczjz5/photo-2024-12-09-19-01-50.jpg)

**Job Info**   
Get information on jobs and logs.  
![](https://i.ibb.co/Smgm608/photo-2024-12-09-19-05-18.jpg)

**Web Terminal**   
I have already implemented remote connection from browser to docker terminal, but then it was direct access via socket.io. Now it's using libp2p signed messages, as in all parts of the agent
![Web Terminal](https://i.ibb.co/Hh2tFpF/photo-2024-12-09-19-08-07.jpg)
