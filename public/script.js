function clickButton(index){
	console.log("CLICKED");
	var btn = document.getElementById(index);
    var a_elem = document.getElementById("nr_produse");
    
    var input_elem = document.getElementById("input_nr_produse");
    var nr_produse = input_elem.value;

	btn.innerHTML = "Produs adaugat";
    nr_produse++;
    a_elem.innerHTML = "Coș:" + nr_produse +" produse";

    input_elem.value = nr_produse;

    setTimeout(() => {
        btn.innerHTML = "Adauga in cos";
    }, 700);
    //btn.disabled = true;
}




var mybutton = document.getElementById("myBtn");

window.onscroll = function() {scrollFunction()};

function scrollFunction() {
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    mybutton.style.display = "block";
  } else {
    mybutton.style.display = "none";
  }
}

function topFunction() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}



const myFunction = () => {
  document.getElementById("first").style.display ='block';
  document.getElementById("second").style.display ='none'
  document.getElementById("third").style.display ='none'
}

const myFunction2 = () => {
  document.getElementById("second").style.display ='block'
  document.getElementById("first").style.display ='none'
  document.getElementById("third").style.display ='none'
}

const myFunction3 = () => {
  document.getElementById("third").style.display ='block'
  document.getElementById("first").style.display ='none'
  document.getElementById("second").style.display ='none'
}