$(document).ready(function() {
  
  var sliding = false,
      curSlide = 1,
      numOfSlides = $(".slider--el").length;
  
  $(document).on("click", ".slider--control", function() {
    if (sliding) return;
    sliding = true;
    $(".slider--el").show();
    $(".slider--el").css("top");
    $(".slider--el.active").addClass("removed");
    ($(this).hasClass("right")) ? curSlide++ : curSlide--;
    if (curSlide < 1) curSlide = numOfSlides;
    if (curSlide > numOfSlides) curSlide = 1;
    $(".slider--el-" + curSlide).addClass("next");
    
    setTimeout(function() {
      $(".slider--el.removed").hide();
      $(".slider--el").removeClass("active next removed");
      $(".slider--el-" + curSlide).addClass("active");
      sliding = false;
    }, 1800);
  });
  
});