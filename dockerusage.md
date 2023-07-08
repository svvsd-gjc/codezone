# Starting the Docker container
- First, build the image: ```docker build .```
- Get the image ID code, using ```docker image ls -a``` and finding the image you just built.
- Run the container using this ID as follows: ```docker run -p 3000:3000 -p 5555:5555 *img_id*```
    - The `-p` modifier forwards ports to the external network, in this case, 3000 is the website, and 5555 is the database interface. Remove, add, or configure as needed.
    - The image ID must come AFTER other options. ```docker run *img_id* -p 3000:3000 -p 5555:5555``` does not work properly. This has caused MANY headaches in the past.
    - The image will copy the repository when it is built. Please built and utilize this container with the respective source code.