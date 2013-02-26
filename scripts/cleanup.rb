#!/usr/bin/env ruby
#coding: utf-8

require 'nokogiri'

def cleanup str
  doc = Nokogiri::HTML.parse(str)
  divs = doc.css('div')
  doc.title = divs.first.css('b')[0].text if doc.title.start_with? 'a'
  divs.first.remove if divs.first
  #remove attributes of body
  doc.css('body').first.attribute_nodes.each{|a| a.remove}
  #replace font elements
  doc.css('font').each{|font|
    color,txt = font['color'],font.text.strip
    symbol = if color == '#FF6600'
                txt == '○' ? '□' : '■'
             elsif color == '#3333FF'
                txt == '○' ? '◇' : '◆'
             end
    if symbol
      symbol = Nokogiri::XML::Text.new(symbol,doc)
      font.replace(symbol)
    end
  }

  #move patterns into PRE elements
  stack = []
  elem = doc.css('p').first
  while elem
    if stack.empty?
      if elem.node_name == 'p' && !elem.css('br').empty? && elem.text =~ /[○●◎⊙]/u
        stack.push(elem)
      end
    else
      if elem.node_name != 'p' || elem.css('br').empty? || elem.text !~ /[○●◎⊙]/u
        #conversion
        author = Nokogiri::XML::Node.new('div',doc)
        author.content = stack[0].child.remove.text
        stack[0].add_previous_sibling(author)
        pre = Nokogiri::XML::Node.new('pre',doc)
        author.add_next_sibling(pre)
        stack.map!{|p|
          con = p.text.split.map{|l|l.strip}
          raise con.join("\n") if con.size % 2 != 0
          p.remove
          con.join("\n")
        }
        pre.content = stack.join("\n\n")
        stack = []
      else
        stack.push(elem)
      end
    end
    elem = elem.next_element
  end

  #remove dtd
  doc.children[0].remove if doc.children[0].type == 14
  doc.serialize save_opts: Nokogiri::XML::Node::SaveOptions::NO_DECLARATION
end

if __FILE__ == $0
  Dir.glob('../src/a*.html').sort.each do |fname|
    begin
      File.open(File.join('..','data', File.basename(fname)),'w') do |fo|
        fo.write(cleanup(File.open(fname).read))
      end
    rescue
      puts "------"
      puts fname
      raise
    end

  end
end