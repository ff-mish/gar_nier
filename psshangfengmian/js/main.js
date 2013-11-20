/**
 * main js for garnier
 */
$(function(){
    //--------------------------------------------
    // for photo take
    var $video  = $('#video');
    var $canvas = $('canvas');
    var $camera = $('.camera');

    var $cover = $('.ps_cover');
    var raphael = null;
    var imgRaphael = null;
    var imgSet  =null ;
    // where load photo , resize first to fixable size
    var $photo    = $('.ps_pho').load(function(){
        $(this).css({
            width: 'auto',
            height: 'auto'
        })
        .show();

        // hide drag element
        $drag.hide();

        // remove last sav
        var $coverImg = $cover.find('img');
        var img = this;
        var tarHeight   = $coverImg.height();
        var tarWidth    = $coverImg.width();
        setTimeout(function(){
            var width   = img.width;
            var height  = img.height;
            if( width / height > tarWidth / tarHeight ){
                width   = width / height * tarHeight;
                height  = tarHeight;
            } else {
                height  = height / width * tarWidth;
                width   = tarWidth;
            }
            if( !raphael ){
                raphael = Raphael( img.parentNode , tarWidth, tarHeight);
                
                imgRaphael = raphael.image( img.src , 0 , 0 , width, height);
            }
            raphael.setSize( tarWidth , tarHeight );

            // reset transform
            imgRaphael.attr({
                src     : img.src,
                width   : width,
                height  : height
            })
            .transform('');
            transformMgr.reset();
            // // Creates canvas 320 × 200 at 10, 50
            // var paper = Raphael( img.parentNode , width, height);
            // var el = paper.image( img.src , 0 , 0 , width, height);
            // console.log(el);
            $(img).css({
                width: width,
                height : height
            })
            .hide();
        } , 10);
    });


    // for take photo
    function useCamera( ){
        $('.camera_help').fadeIn();
        $('.home .pho_btn').fadeOut();
        $camera.find('canvas')
            .attr({
                width: $camera.width(),
                height: $camera.height()
            })
            .css({
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: -1
            });
        var video = $video[0];
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.oGetUserMedia;
        if (navigator.getUserMedia) {
            navigator.getUserMedia({video: true}, handleVideo, function( e ){
                // TODO..
                console.log ( e );
            });
        }
        function handleVideo(stream) {
            $('#shutter_btn').fadeIn();
            $('.camera_help').fadeOut();
            $video.data('__stream__' , stream );
            // shwo camera_wrap
            $('.camera_wrap').fadeIn();
            video.src = window.URL.createObjectURL(stream);
        }
    }
    // show 'src' photo to cover page
    // for resize and rotate
    function showPhoto( src ){
        // hide other page
        $('.page').hide()
            .filter('.photo')
            .show()
            .find('.ps_pho')
            .attr('src' , src );
        // resize ps_pho_wrap to ps_cover
        $('.ps_pho_wrap').css({
            width: $cover.width(),
            height: $cover.height()
        });

    }


    // takephoto action
    function takePhoto(){
        var canvas = $canvas[0];
        var video = $video[0];
        var ctx = canvas.getContext('2d');
        ctx.drawImage( video , 0 , 0 , $canvas.width() , $canvas.height() );

        // stop use camera , hide the video element
        var stream = $video.data('__stream__' );
        stream && stream.stop();

        // hide video element, and create img element to #photo element
        $camera.hide();

        showPhoto( canvas.toDataURL() );
        //$img.attr('src' , canvas.toDataURL() );
        return;
        // 图片提交到后台, TODO: 这一步在缩放功能完成后移到缩放后的提交方法中
        var data    = {
            width   : 499,
            height  : 375,
            'image_base64'    : $img.attr('src'),
            rotate  : 0,
            x : 90,
            y : 0
        }
        $.ajax({
            type: "POST",
            url: "./web/index.php?r=photo/uploadimage",
            data: data,
            success: function(res) {
                $('.step_load').fadeOut();
                $('.step_succ').fadeIn();
                $('.step_succ_pho img').attr('src','./web'+res.data.path);
            },
            dataType: 'json'
        });
        $('.step_load').fadeIn();
    }

    $('#take_photo_btn').click( useCamera );
    $('#shutter_btn').click( takePhoto );
    $('#photo_ok_btn').click( function(){
        // get all data
        var data = transformMgr.result();
        // TODO .. send data to server

        // TODO .. go to another page

    } );

    $('#photo_repick').click( function(){
        // hide all pages
        $('.page').hide()
            // show home page
            .filter('.home')
            .show();
    });
    // for upload photo
    $('#photo_upload').change(function(){
        if (this.files && this.files[0] && FileReader ) {
            //..create loading
            var reader = new FileReader();
            reader.onload = function (e) {
                // change checkpage img
                showPhoto( e.target.result );
            };
            reader.readAsDataURL(this.files[0]);
        }
    });


    // init drag event for $cover
    
    var transformMgr = (function(){
        var isDragging      = false;
        var isMousedown     = false;
        var startPos        = null;
        var totalMoveX      = 0;
        var totalMoveY      = 0;
        var lastMoveX       = 0;
        var lastMoveY       = 0;

        var originWidth     = 0;
        var originHeight    = 0;
        $photo.load(function(){
            originWidth     = this.width;
            originHeight    = this.height;
        });


        $cover.mousedown( function( ev ){

            isMousedown = true;
            startPos = {
                pageX     : ev.pageX
                , pageY   : ev.pageY
            }
            return false;
        })
        .mousemove( function( ev ){
            if( !isMousedown ) return;
            if( !isDragging ){
                if( Math.abs( ev.pageX - startPos.pageX ) + Math.abs( ev.pageY - startPos.pageY ) >= 10 ){
                    isDragging = true;
                } else {
                    return false;
                }
            }
            // move images
            if( !imgRaphael ) return;

            transform( ev.pageX - startPos.pageX - lastMoveX , ev.pageY - startPos.pageY - lastMoveY );
            lastMoveX = ev.pageX - startPos.pageX;
            lastMoveY = ev.pageY - startPos.pageY;
            //imgRaphael.transform("T" + ( totalMoveX + lastMoveX ) + ',' + ( totalMoveY + lastMoveY ) + "s" + totalScale + 'r' + totalRotate );
            // imgRaphael.attr( {
            //     x: result.x + lastMoveX,
            //     y: result.y + lastMoveY
            // } );
        });

        $(document).mouseup(function(){
            // reset states
            if( !isMousedown ) return;
            isDragging      = false;
            isMousedown     = false;
            startPos        = null;
            totalMoveX += lastMoveX;
            totalMoveY += lastMoveY;

            lastMoveX = 0;
            lastMoveY = 0;
        });


        // init ps_btn_up
        var perRotate   = 10;
        var perScale    = 1.1;

        var totalScale  = 1;
        var totalRotate = 0;
        var transforms = [];

        var trsReg = /T(-?[0-9.]+),(-?[0-9.]+)/;
        var scaReg = /S(-?[0-9.]+),(-?[0-9.]+),(-?[0-9.]+),(-?[0-9.]+)/;
        var rotReg = /R(-?[0-9.]+),(-?[0-9.]+),(-?[0-9.]+)/;

        var transform = function( x , y , s , r ){
            var left = x === undefined ? totalMoveX : x;
            var top = y === undefined ? totalMoveY : y;
            var scale = s === undefined ? totalScale : s;
            var rotate = r === undefined ? totalRotate : r;
            var $coverImg   = $cover.find('img');
            var coverHeight = $coverImg.height();
            var coverWidth  = $coverImg.width();
            var transformValue = imgRaphael.transform();

            
            //console.log( imgRaphael );
            var match = null;
            // move 
            if( x !== undefined ){
                if( transforms.length && ( match = transforms[transforms.length-1].match( trsReg ) ) ){
                    transforms[transforms.length-1] = "T" + ( x + parseFloat( match[1] ) ) + ',' + ( y + parseFloat( match[2] ) );
                } else {
                    transforms.push( "T" + x + ',' + y );
                }
            }
            if( s !== undefined ){
                if( transforms.length && ( match = transforms[transforms.length-1].match( scaReg ) ) ){
                    transforms[transforms.length-1] = "S" + ( s * parseFloat( match[1] ) ) + ','
                         + ( s * parseFloat( match[2] ) )
                         + "," + match[3]
                         + "," + match[4];
                } else {
                    transforms.push( "S" + s + ',' + s + ',' + (coverWidth/2) + "," + (coverHeight/2) );
                }
            }
            if( r !== undefined ) {
                if( transforms.length && ( match = transforms[transforms.length-1].match( rotReg ) ) ){
                    transforms[transforms.length-1] = "R" + ( r + parseFloat( match[1] ) ) 
                        + "," + match[2]
                        + "," + match[3];
                } else {
                    transforms.push( "R" + r + ',' + (coverWidth/2) + "," + (coverHeight/2) );
                }
            }
            imgRaphael.transform( transforms.join('') );
        }

         // TODO.. for long click
        var longTimeout = null;
        var longInterval = null;

        $('.ps_btn_up').mousedown(function(){
            totalScale *= perScale;
            transform( undefined , undefined , perScale );

            longTimeout = setTimeout(function(){
                longInterval = setInterval(function(){
                    transform( undefined , undefined , perScale );
                } , 500 );
            } , 500);

        });

        $('.ps_btn_down').mousedown(function(){
            totalScale /= perScale;
            transform( undefined , undefined , 1/perScale );

            longTimeout = setTimeout(function(){
                longInterval = setInterval(function(){
                    transform( undefined , undefined , 1/perScale );
                } , 500 );
            } , 500);
        });
        
        $('.ps_btn_right').mousedown(function(){
            totalRotate += perRotate
            transform( undefined , undefined , undefined , perRotate);
            longTimeout = setTimeout(function(){
                longInterval = setInterval(function(){
                    transform( undefined , undefined , undefined , perRotate);
                } , 500 );
            } , 500);
        });

        $('.ps_btn_left').mousedown(function(){
            totalRotate -= perRotate;
            transform( undefined , undefined , undefined , -perRotate );
            longTimeout = setTimeout(function(){
                longInterval = setInterval(function(){
                    transform( undefined , undefined , undefined , -perRotate);
                } , 500 );
            } , 500);
        });

        $(document)
            .mouseup(function(){
                clearTimeout( longTimeout );
                clearInterval( longInterval );
            });


        function reset(){
            isDragging      = false;
            isMousedown     = false;
            startPos        = null;
            totalMoveX      = 0;
            totalMoveY      = 0;
            lastMoveX       = 0;
            lastMoveY       = 0;

            totalScale  = 1;
            totalRotate = 0;
            transforms  = [];
        }

        return {
            reset       : reset
            , result    : function(){
                var off  = imgRaphael.getBBox();
                return {
                     width      : originWidth * totalScale,
                    height      : originHeight * totalScale,
                    image_base64: $photo.attr('src'),
                    rotate      : totalRotate,
                    x           : off.x,
                    y           : off.y
                }
            }
        }
    })();

    // for drag upload 
    if( $.fn.dragUpload ){
        var $drag = $('.home_drag').dragUpload( {
            autoUpload: false
            , onDragStart   : function( ev ){
                $drag.show();
            }
            , onDragEnd   : function( ev ){
                $drag.hide()
                    .removeClass('dragover');
            }
            // event
            , onDragOver    : function(){
                $drag.addClass('dragover');
            } 
            , onDrop        : function( ev , files ){
                var reader = new FileReader();
                
                reader.onload = function (e) {
                    // render image
                    showPhoto( e.target.result);
                };
                reader.readAsDataURL( files[0] );
            }  
            , onDragLeave   : function(){
                $drag.removeClass('dragover');
                console.log(1111111);
            }
            , onFileTypeError: function(){
                alert('只难上传图片文件');
            }  
            , onFileSizeError: function(){
                alert('上传的图片超过5M大小');
            }
        } );
    }

    // // reaphael js for resize and rotate photo
    // // Creates canvas 320 × 200 at 10, 50
    // var paper = Raphael(10, 50, 320, 200);

    // // Creates circle at x = 50, y = 40, with radius 10
    // var circle = paper.circle(50, 40, 10);
    // // Sets the fill attribute of the circle to red (#f00)
    // circle.attr("fill", "#f00");

    // // Sets the stroke attribute of the circle to white
    // circle.attr("stroke", "#fff");


    bindHomeEvents();

    function bindHomeEvents() {
        $(window).resize(function() {
            // adjust flash margin
            var falshMarginTop = ($('.main').height() - $('#step1_flash').height()) / 2;
            $('#step1_flash').css('marginTop',falshMarginTop);
        });

        $(window).trigger('resize');

        // Homepage Register
        $('#step2 .step_succ_btn1').click(function(e){
            e.preventDefault();
            if(user == null) {
                $('#step2').fadeOut();
                $('#step3').fadeIn();
                $.cookie('last_page', 'index-reg');
            }
            else {
                $('#step2').fadeOut();
                $('#step5').fadeIn();
                $('.step6_ad').fadeOut();
            }
        });

        $('#step4 .step_back').click(function(e){
            e.preventDefault();
            $('#step4').fadeOut();
            $('#step3').fadeIn();
            window.location.hash = "";
        });

        $('#step3 .step_back').click(function(e){
            e.preventDefault();
            $('#step3').fadeOut();
            $('#step2').fadeIn();
        });

        $('#step2 .step_back').click(function(e){
            e.preventDefault();
            $('#step2').fadeOut();
            $('#step1').fadeIn();
        });

        $('#step5 .link_agian').click(function(e){
            e.preventDefault();
            $('#step5').fadeOut();
            $('.step6_ad').fadeOut();
            $('#step1').fadeIn();
        });

        // Submit register
        $('.form_register_home').ajaxForm({
            beforeSubmit:  function($form){
                console.log($form);
                return $('.form_register_home').valid();
            },
            complete: function(xhr) {
                res = JSON.parse(xhr.responseText);
                if(res.error == null) {
                    window.location.hash = "";
                    $('#step4').fadeOut();
                    $('#step5').fadeIn();
                    $('.step6_ad').fadeIn();
                }
            }
        });

        $('.form_register_home').validate(
        {
            submitHandler: function(form){
            },
            rules: {
                email: { required: true, email:true },
                tel: { required: true },
                password: { required: true, minlength: 5},
                password_confirm: {
                    required: true,
                    equalTo: ".form_register_home input[name='password']"
                }
            },
            messages: {
                email: {required:'请填写您的邮箱', email: '请填写正确的邮箱'},
                tel: {required:'请填写您的手机号码'},
                password: {required:'请填写密码', minlength: '密码不能小于5位'},
                password_confirm: {required:'请填写确认密码', equalTo: '两次输入的密码不相同'}
            }
        });
    }

    if(window.location.hash == '#reg') {
        $('#step1').hide();
        $('#step4').show();
        $.ajax({
            type: "GET",
            url: "web/index.php?r=photo/lastphoto",
            dataType: 'json',
            cache: false
        });
    }

});

function flash_upload(Photo,Width,Height,X,Y,Rotate,Lh_id,User_id){
    var data    = {
        width   : 499,
        height  : 375,
        'image_base64'    : Photo,
        rotate  : 0,
        x : 0,
        y : 0
    }
    $.ajax({
        type: "POST",
        url: "./web/index.php?r=photo/uploadimage",
        data: data,
        success: function(res) {
            //setTimeout("uploadComplete()",1000);
            $('#step1').fadeOut();
            $('.step_load').fadeOut();
            $('.step_succ').fadeIn();
            $('.step_succ_pho img').attr('src','./web'+res.data.path);
        },
        dataType: 'json'
    });
    $('.step_load').fadeIn();

}
function uploadComplete(){
    var flash=document.getElementById("flash");
    if(flash){
        if(flash.js2flashUploadComplete){
        }else{
            flash=null;
        }
    }
    if(flash){
    }else{
        flash=document.getElementsByName("flash");
        if(flash){
            flash=flash[0];
            if(flash){
                if(flash.js2flashUploadComplete){
                }else{
                    flash=null;
                }
            }
        }
    }
    if(flash){
        flash.js2flashUploadComplete("photo_id","photourl");
    }//else{
    //	alert("找不到flash");
    //}
}
