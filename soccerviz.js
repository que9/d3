

(function(){
    "use strict";

    let svgH  = 200,
        svgW  = 500,
        rectW = 20,
        radius= 20,
        gutter= 10;

    const reverse = false;
    const gap = radius*2+gutter;


    d3.select("body")
        .append("div").attr("id", "viz")
        .append("svg").attr("id","svg3")
        .style("border", "1px solid cornflowerblue")
        .style("width", svgW+"px")
        .style("height", svgH+"px")
        .style("border-radius","2px");

    // var xPosition = function( fn, initValue, gutter ){
        
    //     if( !fn || f.constructor !== Function  )
    //             throw new Error("Invalid arguments");
    //     initValue = initValue || 0;
    //     gutter    = gutter || 0;
    //     let count = 0;

    //     return {
    //         do:function(){
    //             initValue = ( !count ) ?   fn( initValue, 0 ) :  fn( initValue, gutter );
    //             count++;
    //             return this;
    //         },

    //         end:function(){
    //             count    = 0;
    //             initValue = 0;
    //             return this;
    //         },

    //         reset:function(){
    //             return this;
    //         }
    //     }        
    // };


    // var positioner = xPosition(function(mem, gutter){
    //     return mem+gutter;
    // },30, 60, 1);

    

    var rediusProjector =  function( d, key ){
        var max = d3.max( d, item => parseFloat(item[key]) );
            return d3.scaleLinear().domain( [0, max] ).range( [2, radius] );
    }

    var colorProjector =  function( d, key ){
        var max = d3.max( d, item => parseFloat(item[key]) );
            return d3.scaleLinear().interpolate( d3.interpolateHsl ).domain( [0,max] ).range(['yellow', "blue"]);
            //return d3.scaleLinear().interpolate( d3.interpolateHcl ).domain( [0,max] ).range(['yellow', "blue"]);
    }

    let defaultKey = "cs";
    //--Loading
    d3.csv("worldcup.csv", (error, data)=>{
          if( error ) 
            throw error;

            //console.info( data );
           

            let dataKeys = d3.keys( data[0] ).filter( item => item !== "team" && item !== "region" );
            //--- Adding buttons            

            d3.select("button.teams")
                .data( dataKeys ).enter()
                .append("button").html(d=>d)
                .on("click", function(target){
                    var circles       = d3.selectAll("g.circles").select("circle");
                    var uniqueRegion  = (d3.nest().key( d=> d.region ).entries( data )).map( item => item.key );
                    var colorRamp     = d3.scaleOrdinal(d3.schemeCategory10, uniqueRegion);

                    var max = d3.max( data, d=>{
                        return d[target];
                    });

                    console.log("Max "+max+', target :'+target);


                    var quantileScale = d3.scaleQuantile().domain( [0, max] ).range( colorbrewer.Accent[6] );
                    //console.info(uniqueRegion);
                    var radiusScale = rediusProjector(data, target );
                        circles.transition().duration(250)
                            .style("fill", d => quantileScale( d[target] ) )
                            .attr("r", d => radiusScale(d[target]) );
                });





            d3.text("modal.html", d=>{
                d3.select("body").append("div").attr("id", "modal")
                    .style("display","none")
                    .html(d)
                    .on("dblclick", function(){
                        d3.select(this).style("display","none");
                    });
                    
            });



            d3.html("./footbal.svg", function( footbal ){
                console.info( footbal, d3.select(footbal).selectAll("g"));
                
                var $div = d3.select("#svg3").append("g").attr("id", "footbal");
                while( !d3.select(footbal).selectAll("path").empty() ){
                    $div.node().appendChild(d3.select(footbal).select("path").node());
                }
                
                d3.select("#footbal").attr("transform", `translate(${svgW/3}, ${svgH/10})`);
            });



            //-- Adding grouping element
            let Cirlces = d3.select("#svg3")
                .append("g")
                .attr("id", "teamsg")
                .attr("transform", `translate(${radius+gutter}, ${svgH-radius*2})`)
                
                .selectAll("g.circles").data( data ).enter()
                .append("g")
                .style("cursor", "pointer")
                .attr("class","circles")                
                .on("mouseenter", function( data, index,  target ){
                    var $this = d3.select(this);
                    var $target = $this.select("circle");                    
                    $target.transition().duration(250).style("stroke-width", "3px");
                    //console.log( $this.select("text").attr("y") );
                    $this.select("text").classed("highlight", true).transition().attr("y", radius/2);
                    this.parentElement.appendChild( this );
                })
                .on("mouseleave", function(){          
                    var $this = d3.select(this);
                    var $target = $this.select("circle");
                    $target.transition().duration(100).style("stroke-width", "1px");
                    $this.select("text").classed("highlight", false).transition(100).attr("y", 30);
                })

                .on("click", function(data, index, elements){
                        let $modal = d3.select("#modal");
                        $modal.select("tbody").html(function(){
                            let str = "";
                            Object.keys(data).forEach( key => {
                                str += `<tr><td>${key}</td><td class="data">${data[key]}</td></tr>`;
                            });  
                            return str;
                        });

                        $modal.transition().style("display","block");
                })
                .attr("transform", (d,i) => `translate(${i*50}, 0 )` );

                
            //-- Adding acctual circles
                Cirlces.append("circle")
                    .attr("r", 0)
                    //.style("fill","cornflowerblue")
                    .style("fill", d => colorProjector(data, defaultKey)(d[defaultKey]) )
                    .style("stroke","#434343")
                    .style("stroke-width","1px")  
                    .transition().duration(600).delay((d,i)=> i*100)
                    .attr("r", d => rediusProjector(data, defaultKey )( d[defaultKey] )*2 )
                    .attr("class","circle")                    
                    .transition()
                    .attr("r", d => radius);                                                          
            
            //-- Adding labels
                Cirlces.append("text")
                    .style("opacity","0")
                    .style("text-anchor", "middle")
                    .style("font-weight","600")
                    .text(d=> d.team)
                    .transition().duration(400)
                    .style("opacity",1)
                    .style("font-size","12px")
                    .attr("y", radius+gutter );
            
            Cirlces.insert("image")
                .attr("xlink:href", d=> "./images/"+d.team.toLowerCase()+".png" )
                .attr("width", radius*2).attr("height", radius)
                .attr("x", -radius )
                .attr("y", -radius/2)

        });

}());