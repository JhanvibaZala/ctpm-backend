function showToast(message,type){

    const toast = document.getElementById("toast");

    if(!toast){
        console.log("Toast element not found");
        return;
    }


    toast.innerText = message;

    toast.className = type;

    toast.style.display = "block";


    setTimeout(()=>{

        toast.style.display = "none";

    },3000);

}