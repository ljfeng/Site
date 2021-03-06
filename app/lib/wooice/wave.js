(function ($) {
    $.fn.soundWave = function(options)
    {
        if ($('body').data('soundWave')) {
            return $('body').data('soundWave');
        }

        function init()
        {
            var soundData = {};
            //init sound list, which will cache sounds
            soundData.soundList = [];
            soundData.currentSound = null;

            return soundData;
        }

        $.extend(this, {
            addSound : function(sound)
            {
                soundData.soundList[sound.id] = sound;
            }
        });

        $.extend(this, {
            render : function(sound)
            {
                if (!soundData.soundList[sound.id])
                {
                    soundData.soundList[sound.id] = sound;
                }

                 if ($('#sound_wave_'+sound.id).data('rendered'))
                 {
                     return;
                 }

                var stage = new Kinetic.Stage({
                    container: 'sound_wave_'+sound.id,
                    width: $('#sound_wave_'+sound.id).width(),
                    height: $('#sound_wave_'+sound.id).height()
                });

                sound =  soundData.soundList[sound.id];
                var layer = new Kinetic.Layer({
                    id : 'wave-form'
                });
                var widthPerLine = stage.getWidth()/sound.waveData.length;
                var mainLinePerctg = 0.7, shadowPerctg = 0.3;
                $.each(sound.waveData, function(index, data)
                {
                    var mainLine = new Kinetic.Line({
                        id: 'mainLine_'+ index,
                        name: 'lines',
                        points: [index * widthPerLine, stage.getHeight()*mainLinePerctg*(1-data), index * widthPerLine, stage.getHeight()*mainLinePerctg],
                        stroke: '#242424',
                        strokeWidth: widthPerLine,
                        lineJoin: 'round',
                        lineCap: 'round'
                    });
                    var shadowLine = new Kinetic.Line({
                        id: 'shadowLine_'+ index,
                        name: 'shadows',
                        points: [index * widthPerLine, stage.getHeight()*mainLinePerctg, index * widthPerLine, stage.getHeight()*(mainLinePerctg+data*shadowPerctg)],
                        stroke: '#9E9E9E',
                        strokeWidth: widthPerLine,
                        lineJoin: 'round'
                    });
                    //TODO: add click event to each line(jump and play)
                    layer.add(mainLine);
                    layer.add(shadowLine);
                });
                stage.add(layer);
                $('#sound_wave_'+sound.id).data('stage', stage);
                $('#sound_wave_'+sound.id).data('rendered', true)
            }
        });

        $.extend(this, {
            play : function(sound)
            {
                if($('#sound_wave_'+sound.id).data('isPlaying'))
                {
                    return ;
                }
                $('#sound_wave_'+sound.id).data('isPlaying', true);
                var soundToPlay = soundData.soundList[sound.id];
                var point = soundToPlay.currentWavePoint;
                point = (point)? point:0;
                var misiSecPerLine = soundToPlay.duration/soundToPlay.waveData.length;
                var timerId = setInterval(run, misiSecPerLine);
                soundToPlay.timerId = timerId;
                var stage = $('#sound_wave_'+sound.id).data('stage');
                var layer = stage.get('#wave-form')[0];

                //TODO: This approach isn't reliable, need to change to whileplaying event handler to control wave move speed later.
                //TODO: For js execution, use web worker later
                function run()
                {
                    if (point>= soundToPlay.waveData.length)
                    {
                        clearInterval(timerId);
                        return ;
                    }
                    var mainLinePerctg = 0.7, shadowPerctg = 0.3;
                    var widthPerLine = stage.getWidth()/soundToPlay.waveData.length;
                    var mainLine = layer.get('#mainLine_'+point)[0];
                    mainLine.setStroke('#00B2EE');
                    var shadowLine = layer.get('#shadowLine_'+point)[0];
                    shadowLine.setStroke('#A4D3EE');
                    layer.draw();
                    soundToPlay.currentWavePoint = point++;
                }
            }
        });

        $.extend(this, {
            move : function(sound)
            {
                var soundToPlay = soundData.soundList[sound.id];
                var point = soundToPlay.currentWavePoint;
                point = (point)? point: 0;
                var stage = $('#sound_wave_'+sound.id).data('stage');
                var layer = stage.get('#wave-form')[0];

                var mainLinePerctg = 0.7, shadowPerctg = 0.3;
                var mainLine = layer.get('#mainLine_'+point)[0];
                mainLine.setStroke('blue');
                var shadowLine = layer.get('#shadowLine_'+point)[0];
                shadowLine.setStroke('yellow');
                layer.draw();
                soundToPlay.currentWavePoint = point++;
            }
        });

        $.extend(this, {
            pause : function(sound)
            {
                $('#sound_wave_'+sound.id).data('isPlaying', false);
                var soundToPause = soundData.soundList[sound.id];
                clearInterval(soundToPause.timerId);
            }
        });

        $.extend(this, {
            jump : function(sound, toWavePoint)
            {
                var soundToJump = soundData.soundList[sound.id];

                //From current line of wave data to toWavePoint line of wave data.
                for(var point=soundToJump.currentWavePoint; point<toWavePoint; point++)
                {
                    var stage = $('#sound_wave-'+sound.id).data('stage');
                    var layer = stage.get('#wave-form');
                    var mainLine = new Kinetic.Line({
                        points: [point * widthPerLine, stage.getWidth()*0.7*(1-data), point * widthPerLine, stage.getWidth()*0.7],
                        stroke: 'red',
                        strokeWidth: widthPerLine,
                        lineJoin: 'round'
                    });
                    var shadowLine = new Kinetic.Line({
                        points: [point * widthPerLine, stage.getWidth()*0.7, point * widthPerLine, stage.getWidth()*(0.7+data*0.3 *0.3)],
                        stroke: 'orange',
                        strokeWidth: widthPerLine,
                        lineJoin: 'round'
                    });
                    layer.add(mainLine);
                    layer.add(shadowLine);
                }
                $('body').trigger('onJump',
                    {
                        id : sound.id,
                        from : 1000 * (soundToJump*soundToJump.duration/soundToJump.waveData.length)
                    }
                );
            }
        });

        function setupListeners()
        {
            $('body').bind('onPlay', $.proxy(function(event, sound)
            {
                this.play(sound);
            },this));
            $('body').bind('onOneMove', $.proxy(function(event, sound)
            {
                this.move(sound);
            },this));
            $('body').bind('onPause', $.proxy(function(event,sound)
            {
                this.pause(sound);
            },this));
        }

        $.proxy(setupListeners,this)();
        var soundData = init();
        $('body').data('soundWave', this);
        return this;
    }
})(jQuery);