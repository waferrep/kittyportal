
//javascript for page navigation and maybe maxwell funniness

document.addEventListener("DOMContentLoaded", () => {

    //number of blogs
    const numberOfBlogs = 2;

    //href get
    const prevHref = document.getElementById("previous-href");
    const nextHref = document.getElementById("next-href");
    const latestBlog = `blog${numberOfBlogs}.html`;
    
    //get path
    const fullPath = window.location.pathname;
    const currentPath = fullPath.split('/').pop();
    
    if (currentPath === 'undefined.html'){
            nextHref.href = `blog1.html`;
            prevHref.href = latestBlog;
    }

    else{

        //parse number and turn real
        const blogNumber = currentPath.match(/(\d+)/);
        const blogParsed = parseInt(blogNumber[1], 10);

        //get next and prev blog
        const prevBlog = `blog${blogParsed - 1}.html`;
        const nextBlog = `blog${blogParsed + 1}.html`;

        //prev
        if (blogParsed > 1) {
            prevHref.href = prevBlog;
        }
        else {
            prevHref.href = "undefined.html"
        }

        //next
        if (blogParsed < numberOfBlogs) {
            nextHref.href = nextBlog;
        }
        else{
            nextHref.style.display = "none";
        }

    }
});

document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("commentHeader");
  const section = document.getElementById("commentToggle");

  if (header && section) {
    header.addEventListener("click", () => {
      section.classList.toggle("expanded");
    });
  }
});


